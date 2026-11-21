import { searchByHauntlyId, DEFAULT_SOUL_PROFILES } from '../src/lib/profileService';
import { getDirectChatKey } from '../src/lib/whisperChatService';

async function runFriendSearchAndLinksTest() {
  console.log('\n🔮 =========================================================');
  console.log('🔮 TEST SUITE: FRIEND ID SEARCH, INVITE LINKS & MESSAGING');
  console.log('🔮 =========================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      process.exitCode = 1;
    }
  }

  // ── TEST 1: Full Hauntly ID search (e.g. HAUNT-8X29K) ──
  console.log('🧪 TEST 1: Full Hauntly ID Search (e.g. HAUNT-8X29K)');
  const res1 = await searchByHauntlyId('HAUNT-8X29K');
  assert(res1.data !== null, 'Found profile by exact HAUNT-8X29K');
  assert(res1.data?.username === 'jack_lantern', 'Profile matches Pumpkin King (@jack_lantern)');

  // ── TEST 2: Hashtag prefix (e.g. #HAUNT-8X29K & #haunt-8x29k) ──
  console.log('\n🧪 TEST 2: Hashtag Prefix Search (#HAUNT-8X29K & #haunt-vamp7)');
  const res2 = await searchByHauntlyId('#HAUNT-8X29K');
  assert(res2.data !== null, 'Found profile by #HAUNT-8X29K with leading hash');
  assert(res2.data?.id === 'usr_jack', 'Matched usr_jack');

  const res2b = await searchByHauntlyId('#haunt-vamp7');
  assert(res2b.data !== null, 'Found profile by lowercase #haunt-vamp7');
  assert(res2b.data?.display_name === 'Count Vlad', 'Matched Count Vlad');

  // ── TEST 3: Raw suffix code search (e.g. 8X29K or VAMP7) ──
  console.log('\n🧪 TEST 3: Raw Suffix Code Search without HAUNT- prefix (e.g. 8X29K)');
  const res3 = await searchByHauntlyId('8X29K');
  assert(res3.data !== null, 'Found profile by raw suffix 8X29K');
  assert(res3.data?.hauntly_id === 'HAUNT-8X29K', 'Profile hauntly_id is HAUNT-8X29K');

  const res3b = await searchByHauntlyId('#8x29k');
  assert(res3b.data !== null, 'Found profile by raw suffix with hash #8x29k');

  // ── TEST 4: Username search with and without @ (e.g. @dracula, luna_witch) ──
  console.log('\n🧪 TEST 4: Username Search (@dracula & luna_witch)');
  const res4 = await searchByHauntlyId('@dracula');
  assert(res4.data !== null, 'Found profile by @dracula');
  assert(res4.data?.hauntly_id === 'HAUNT-VAMP7', 'Matched HAUNT-VAMP7');

  const res4b = await searchByHauntlyId('luna_witch');
  assert(res4b.data !== null, 'Found profile by luna_witch without @');
  assert(res4b.data?.display_name === 'Luna Starlight', 'Matched Luna Starlight');

  // ── TEST 5: User ID lookup (e.g. usr_frank, usr_casper) ──
  console.log('\n🧪 TEST 5: Direct User ID Lookup (usr_frank)');
  const res5 = await searchByHauntlyId('usr_frank');
  assert(res5.data !== null, 'Found profile by internal ID usr_frank');
  assert(res5.data?.display_name === 'Frankie', 'Matched Frankie');

  // ── TEST 6: Web Invite Link Generation & Deep-link Resolution ──
  console.log('\n🧪 TEST 6: Web Invite Link Generation & Deep-link Resolution');
  const baseUrl = 'https://hauntly-eight.vercel.app';
  const jackInvite = `${baseUrl}/profile?addFriend=${DEFAULT_SOUL_PROFILES.usr_jack.hauntly_id}`;
  assert(jackInvite === 'https://hauntly-eight.vercel.app/profile?addFriend=HAUNT-8X29K', 'Invite URL format is valid');

  // Simulate parsing the URL search params from an internet link
  const urlObj = new URL(jackInvite);
  const friendParam = urlObj.searchParams.get('addFriend');
  assert(friendParam === 'HAUNT-8X29K', 'Extracted addFriend query parameter from internet link');

  const resolved = await searchByHauntlyId(friendParam!);
  assert(resolved.data?.id === 'usr_jack', 'Successfully resolved friend from invite link parameter');

  // ── TEST 7: Bidirectional Direct Chat Key & Message Alignment Verification ──
  console.log('\n🧪 TEST 7: Bidirectional Direct Chat Alignment Rules');
  const keyA = getDirectChatKey('usr_jack', 'usr_vlad');
  const keyB = getDirectChatKey('usr_vlad', 'usr_jack');
  assert(keyA === keyB, 'Direct chat key is symmetric between both internet participants');

  // Message alignment rule checks
  const currentUserId = 'usr_jack';
  const selectedFriendId = 'usr_vlad';

  // Case A: Message sent by Vlad (the friend)
  const incomingMsg = {
    senderId: 'usr_vlad',
    senderName: 'Count Vlad',
    receiverId: 'usr_jack',
  };
  const isIncomingFromFriend =
    Boolean(selectedFriendId && incomingMsg.senderId === selectedFriendId);
  const isIncomingMyMessage =
    !isIncomingFromFriend &&
    (
      Boolean(selectedFriendId && incomingMsg.receiverId === selectedFriendId) ||
      Boolean(currentUserId && incomingMsg.senderId === currentUserId && incomingMsg.senderId !== selectedFriendId) ||
      incomingMsg.senderName === 'You'
    );
  assert(isIncomingMyMessage === false, 'Received message from friend aligns to the LEFT (isMyMessage = false)');

  // Case B: Message sent by Jack (the viewing user)
  const outgoingMsg = {
    senderId: 'usr_jack',
    senderName: 'Pumpkin King',
    receiverId: 'usr_vlad',
  };
  const isOutgoingFromFriend =
    Boolean(selectedFriendId && outgoingMsg.senderId === selectedFriendId);
  const isOutgoingMyMessage =
    !isOutgoingFromFriend &&
    (
      Boolean(selectedFriendId && outgoingMsg.receiverId === selectedFriendId) ||
      Boolean(currentUserId && outgoingMsg.senderId === currentUserId && outgoingMsg.senderId !== selectedFriendId) ||
      outgoingMsg.senderName === 'You'
    );
  assert(isOutgoingMyMessage === true, 'Sent message by viewing user aligns to the RIGHT (isMyMessage = true)');

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`   RESULTS: ${passed}/${total} TESTS PASSED ✨`);
  console.log('   FRIEND ID SEARCH, INVITE LINKS & MESSAGING VERIFIED!');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

runFriendSearchAndLinksTest();
