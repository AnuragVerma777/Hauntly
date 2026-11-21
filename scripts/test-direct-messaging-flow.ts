import { getDirectChatKey } from '../src/lib/whisperChatService';
import {
  getOrCreateConversation,
  listUserConversations,
  sendDirectWhisper,
  fetchConversationMessages,
  deleteDirectWhisper,
} from '../src/lib/directChatService';
import { searchByHauntlyId, createCompanionFromId } from '../src/lib/profileService';

async function runTests() {
  console.log('🦇 HAUNTLY DIRECT MESSAGING & SEARCH SPIRITS TEST SUITE 🦇\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${details ? ` -> ${details}` : ''}`);
      failed++;
    }
  }

  // 1. CANONICAL KEYS & DUPLICATE PREVENTION
  console.log('--- TEST 1: CANONICAL KEY & DUPLICATE CONVERSATION PREVENTION ---');
  const userA = 'usr_alex_123';
  const userB = 'usr_dracula_456';
  const key1 = getDirectChatKey(userA, userB);
  const key2 = getDirectChatKey(userB, userA);
  assert(key1 === key2, 'Canonical key is symmetric regardless of initiator', `key1: ${key1}, key2: ${key2}`);
  assert(key1 === `hauntly_whisper_${userA}_${userB}`, 'Key sorted correctly');

  // Test getOrCreateConversation canonical behavior
  const convRes1 = await getOrCreateConversation({
    currentUserId: userA,
    partnerId: userB,
  });
  const convRes2 = await getOrCreateConversation({
    currentUserId: userB,
    partnerId: userA,
  });
  assert(Boolean(convRes1.conversation), 'Conversation created for userA');
  assert(Boolean(convRes2.conversation), 'Conversation retrieved for userB');
  assert(
    convRes1.conversation.id === convRes2.conversation.id,
    'Both users share the exact same conversation id without duplicates',
    `conv1 id: ${convRes1.conversation.id}, conv2 id: ${convRes2.conversation.id}`
  );

  // Self-conversation prevention
  const selfConv = await getOrCreateConversation({
    currentUserId: userA,
    partnerId: userA,
  });
  assert(Boolean(selfConv.error), 'Self-conversation is correctly rejected with error', selfConv.error);

  // 2. SEARCH BY USERNAME & HAUNTLY ID
  console.log('\n--- TEST 2: SEARCH SPIRITS BY USERNAME & HAUNTLY ID ---');
  // Seed profiles in profileService
  const searchExactId = await searchByHauntlyId('#HAUNT-8X29K');
  assert(Boolean(searchExactId.data), 'Search by exact Hauntly ID with hash (#HAUNT-8X29K)');
  assert(searchExactId.data?.hauntly_id.toUpperCase() === 'HAUNT-8X29K', 'Matched expected Hauntly ID');

  const searchRawCode = await searchByHauntlyId('8X29K');
  assert(Boolean(searchRawCode.data), 'Search by raw 5-char code suffix (8X29K)');

  const searchUsername = await searchByHauntlyId('@dracula');
  assert(Boolean(searchUsername.data), 'Search by @username (@dracula)');
  assert(searchUsername.data?.username.toLowerCase() === 'dracula', 'Matched username dracula');

  // Fallback companion generator for un-synced offline IDs
  const fallbackCompanion = createCompanionFromId('HAUNT-7M9Q2');
  assert(Boolean(fallbackCompanion), 'Fallback companion generation succeeds for remote IDs');
  assert(fallbackCompanion.hauntly_id === 'HAUNT-7M9Q2', 'Fallback companion has valid hauntly_id');

  // 3. START WHISPER & CONVERSATION LISTING IN SIDEBAR
  console.log('\n--- TEST 3: START WHISPER & SIDEBAR CONVERSATION LISTING ---');
  const targetUser = 'usr_sarah_789';
  const whisperConv = await getOrCreateConversation({
    currentUserId: userA,
    partnerId: targetUser,
    partnerProfile: {
      id: targetUser,
      hauntly_id: 'HAUNT-SARAH1',
      username: 'sarah_witch',
      display_name: 'Sarah the Sorceress',
      avatar_url: '/avatars/avatar_vampire.jpg',
      created_at: new Date().toISOString(),
    },
  });
  assert(Boolean(whisperConv.conversation), 'Start Whisper created/opened 1-to-1 conversation');

  const convList = await listUserConversations(userA);
  assert(convList.length > 0, `User conversation list is not empty (found ${convList.length})`);
  const foundInSidebar = convList.some((c) => c.partnerId === targetUser);
  assert(foundInSidebar, 'Sarah appears in userA sidebar conversation list');

  // Verify deduplication in list
  const partnerIds = convList.map((c) => c.partnerId);
  const uniquePartnerIds = new Set(partnerIds);
  assert(partnerIds.length === uniquePartnerIds.size, 'Sidebar contains zero duplicate conversation entries');

  // 4. SEND & RECEIVE REAL-TIME DIRECT MESSAGES
  console.log('\n--- TEST 4: SEND & RECEIVE DIRECT MESSAGES ---');
  const msg1 = await sendDirectWhisper({
    senderId: userA,
    senderName: 'Alex',
    receiverId: targetUser,
    text: 'Meet me at the graveyard gates when the bell strikes midnight 🕯️',
  });
  assert(Boolean(msg1.id), 'Sent whisper returned valid message id');
  assert(msg1.text.includes('graveyard'), 'Message text matches');

  const msg2 = await sendDirectWhisper({
    senderId: targetUser,
    senderName: 'Sarah',
    receiverId: userA,
    text: 'I shall bring the hemlock brew. 🌙',
  });
  assert(Boolean(msg2.id), 'Partner reply sent successfully');

  // Fetch messages between userA and targetUser
  const chatHistory = await fetchConversationMessages(userA, targetUser);
  assert(chatHistory.length >= 2, `Direct chat history contains both messages (${chatHistory.length} found)`);
  assert(chatHistory.some((m) => m.id === msg1.id), 'UserA message is present in history');
  assert(chatHistory.some((m) => m.id === msg2.id), 'Partner message is present in history');

  // Prevent self-whispering
  let selfWhisperError = false;
  try {
    await sendDirectWhisper({
      senderId: userA,
      senderName: 'Alex',
      receiverId: userA,
      text: 'Talking to myself',
    });
  } catch (err: unknown) {
    selfWhisperError = true;
  }
  assert(selfWhisperError, 'Self-messaging is strictly prohibited');

  // 5. REOPEN CONVERSATION & PERSISTENCE
  console.log('\n--- TEST 5: REOPEN CONVERSATION & PERSISTENCE ---');
  // Re-list conversations to verify lastMessage is updated
  const updatedList = await listUserConversations(userA);
  const sarahConv = updatedList.find((c) => c.partnerId === targetUser);
  assert(Boolean(sarahConv), 'Conversation persists in list');
  assert(
    sarahConv?.lastMessage === msg2.text,
    'Sidebar reflects latest message',
    `Expected: "${msg2.text}", Got: "${sarahConv?.lastMessage}"`
  );

  // 6. MESSAGE DELETION (OWNERSHIP ENFORCED)
  console.log('\n--- TEST 6: MESSAGE DELETION & OWNERSHIP ---');
  // Attempt to delete partner's message as userA -> should fail
  const unauthorizedDelete = await deleteDirectWhisper({
    messageId: msg2.id,
    userId1: userA,
    userId2: targetUser,
    currentUserId: userA,
  });
  assert(!unauthorizedDelete.success, 'Cannot delete someone else\'s whisper');

  // Delete own message -> should succeed
  const authorizedDelete = await deleteDirectWhisper({
    messageId: msg1.id,
    userId1: userA,
    userId2: targetUser,
    currentUserId: userA,
  });
  assert(authorizedDelete.success, 'Successfully deleted own whisper message');

  const historyAfterDelete = await fetchConversationMessages(userA, targetUser);
  assert(!historyAfterDelete.some((m) => m.id === msg1.id), 'Deleted message is completely removed from chat history');

  console.log(`\n========================================`);
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
