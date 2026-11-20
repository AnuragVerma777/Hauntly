/**
 * ════════════════════════════════════════════════════════════════════════════
 * HAUNTLY END-TO-END TEST SUITE: LOCATION SUGGESTIONS & 3D GLOBE INTEGRATION
 * Tests:
 *  1. Geocoding search (Nominatim API + Hotspot fallback)
 *  2. Suggesting a location for a group (Database persistence)
 *  3. Chat card message generation and parsing
 *  4. Member voting & duplicate vote prevention
 *  5. Vote tallying and leading location computation
 *  6. Admin final selection
 *  7. Globe synchronization & marker metadata
 * ════════════════════════════════════════════════════════════════════════════
 */

import {
  searchPlaces,
  suggestLocation,
  isLocationSuggestionMessage,
  parseLocationSuggestion,
  voteForLocation,
  fetchLocationVotes,
  selectFinalLocation,
} from '../src/lib/locationSuggestionService';
import { fetchGroupLocations } from '../src/lib/globeService';
import { fetchGroupMessages } from '../src/lib/groupChatService';

// Ensure in-memory localStorage polyfill for Node test environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] || null,
    length: store.size,
  } as any;
}

const TEST_GROUP_ID = 'grp_designers';
const USER_ALICE = 'usr_alice_witch';
const USER_BOB = 'usr_bob_ghost';
const USER_CHARLIE_ADMIN = 'usr_austin'; // Admin user in grp_designers

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function runTestSuite() {
  console.log('\n🌕 Starting Hauntly Location Suggestions & 3D Globe Test Suite...\n');

  // ── Step 1: Test Geocoding Search ──────────────────────────────────────────
  console.log('[1/7] Testing Geocoding Search (OSM Nominatim / Hotspots)...');
  const searchResults = await searchPlaces('Bran Castle');
  assert(searchResults.length > 0, `Geocoding returned ${searchResults.length} places for 'Bran Castle'`);
  const first = searchResults[0];
  assert(first.name.includes('Bran'), `First result is "${first.name}"`);
  assert(typeof first.lat === 'number' && typeof first.lon === 'number', 'Coordinates are valid numbers');
  console.log(`  Found: ${first.name} at (${first.lat}, ${first.lon})\n`);

  // ── Step 2: Test Suggesting Location & Database Persistence ────────────────
  console.log('[2/7] Testing Suggesting Location (DB Save + Chat Message)...');
  const suggestRes = await suggestLocation({
    groupId: TEST_GROUP_ID,
    userId: USER_ALICE,
    name: 'Poveglia Island Plague Crypt',
    address: 'Venetian Lagoon, Venice 30100, Italy',
    description: 'An abandoned island sanctuary cloaked in mist and centuries of nocturnal legend.',
    latitude: 45.3824,
    longitude: 12.3315,
    category: 'crypt',
  });

  assert(suggestRes.error === null, 'Location suggestion succeeded without errors');
  assert(suggestRes.location !== null, 'Location was successfully created in group_locations');
  const createdLocId = suggestRes.location!.id;
  assert(createdLocId.length > 0, `Created location ID: ${createdLocId}`);
  assert(suggestRes.location!.name === 'Poveglia Island Plague Crypt', 'Location name matches');
  assert(suggestRes.location!.latitude === 45.3824, 'Latitude matches');
  assert(suggestRes.location!.longitude === 12.3315, 'Longitude matches');
  console.log(`  Location ID: ${createdLocId}\n`);

  // ── Step 3: Test Chat Card Message Generation and Parsing ───────────────────
  console.log('[3/7] Testing Chat Card Message Format and Parser...');
  const chatMessagesRes = await fetchGroupMessages(TEST_GROUP_ID, USER_ALICE, 10);
  assert(chatMessagesRes.data.length > 0, `Fetched ${chatMessagesRes.data.length} group messages`);

  const suggestionMsg = chatMessagesRes.data.find((m) =>
    isLocationSuggestionMessage(m.content) && m.content.includes(createdLocId)
  );
  assert(suggestionMsg !== undefined, 'Found location suggestion card message in chat stream');

  const parsed = parseLocationSuggestion(suggestionMsg!.content);
  assert(parsed !== null, 'Parsed location suggestion data successfully');
  assert(parsed!.location_id === createdLocId, 'Parsed location ID matches created location');
  assert(parsed!.name === 'Poveglia Island Plague Crypt', 'Parsed name matches');
  assert(parsed!.category === 'crypt', 'Parsed category is crypt');
  console.log(`  Chat card verified for: "${parsed!.name}"\n`);

  // ── Step 4: Test Member Voting & Duplicate Prevention ──────────────────────
  console.log('[4/7] Testing Voting Mechanism & Duplicate Vote Prevention...');
  // Alice votes
  const vote1 = await voteForLocation(createdLocId, USER_ALICE, TEST_GROUP_ID);
  assert(vote1.action === 'voted' && vote1.error === null, 'Alice cast her vote');

  // Verify Alice's vote counted
  let votesMap = await fetchLocationVotes(TEST_GROUP_ID, USER_ALICE);
  let locVoteData = votesMap.data.get(createdLocId);
  assert(locVoteData !== undefined && locVoteData.count === 1, 'Vote count is 1 after Alice votes');
  assert(locVoteData!.votedByUser === true, 'Alice is marked as having voted');

  // Alice votes again -> toggles off (unvote), preventing duplicate vote accumulation
  const vote2 = await voteForLocation(createdLocId, USER_ALICE, TEST_GROUP_ID);
  assert(vote2.action === 'unvoted', 'Duplicate vote from same user safely unvoted (toggle)');
  votesMap = await fetchLocationVotes(TEST_GROUP_ID, USER_ALICE);
  locVoteData = votesMap.data.get(createdLocId);
  assert(!locVoteData || locVoteData.count === 0, 'Vote count safely returned to 0');

  // Alice re-votes, and Bob also votes
  await voteForLocation(createdLocId, USER_ALICE, TEST_GROUP_ID);
  const bobVote = await voteForLocation(createdLocId, USER_BOB, TEST_GROUP_ID);
  assert(bobVote.action === 'voted', 'Bob cast his vote');

  votesMap = await fetchLocationVotes(TEST_GROUP_ID, USER_ALICE);
  locVoteData = votesMap.data.get(createdLocId);
  assert(locVoteData !== undefined && locVoteData.count === 2, 'Vote count is now 2 from Alice and Bob');
  assert(locVoteData!.voterIds.includes(USER_ALICE) && locVoteData!.voterIds.includes(USER_BOB), 'Both voter IDs recorded');
  console.log(`  Votes counted: 2 votes (Alice, Bob)\n`);

  // ── Step 5: Test Leading Location Computation ──────────────────────────────
  console.log('[5/7] Testing Leading Location Highlighting...');
  const locationsRes = await fetchGroupLocations(TEST_GROUP_ID);
  assert(locationsRes.data.length > 0, `Fetched ${locationsRes.data.length} locations for group`);

  const povegliaOnGlobe = locationsRes.data.find((l) => l.id === createdLocId);
  assert(povegliaOnGlobe !== undefined, 'Poveglia location exists in group locations');
  assert(povegliaOnGlobe!.vote_count === 2, `Poveglia vote_count on globe is ${povegliaOnGlobe!.vote_count}`);
  assert(povegliaOnGlobe!.leading_location === true, 'Poveglia has highest votes and is marked leading_location');
  console.log(`  Poveglia is designated 👑 Leading Location!\n`);

  // ── Step 6: Test Admin Final Location Selection ────────────────────────────
  console.log('[6/7] Testing Admin Final Location Selection (Crown Sanctuary)...');
  const selectRes = await selectFinalLocation(createdLocId, TEST_GROUP_ID, USER_CHARLIE_ADMIN);
  assert(selectRes.error === null, 'Admin successfully selected final location');

  const refreshedLocs = await fetchGroupLocations(TEST_GROUP_ID);
  const selectedLoc = refreshedLocs.data.find((l) => l.id === createdLocId);
  assert(selectedLoc !== undefined && selectedLoc.is_selected === true, 'Location is now marked is_selected: true');
  assert(refreshedLocs.data[0].id === createdLocId, 'Selected location sorted to the top of the sanctuary list');
  console.log(`  Poveglia is now ⭐ Official Selected Sanctuary of the coven!\n`);

  // ── Step 7: Test Cross-Component Synchronization ───────────────────────────
  console.log('[7/7] Testing Globe & Chat Sync Data Attributes...');
  assert(selectedLoc!.latitude === 45.3824 && selectedLoc!.longitude === 12.3315, 'Globe coordinates are exact');
  assert(selectedLoc!.category === 'crypt', 'Category is crypt');
  assert(selectedLoc!.vote_count === 2, 'Vote count persists accurately on globe');
  console.log('  Globe marker contains full metadata ready for 3D camera focus and HUD\n');

  console.log('════════════════════════════════════════════════════════════════════');
  console.log('🎉 ALL 7 INTEGRATION TESTS PASSED SUCCESSFULLY!');
  console.log('════════════════════════════════════════════════════════════════════\n');
}

runTestSuite().catch((err) => {
  console.error('Test Suite Failed with Exception:', err);
  process.exit(1);
});
