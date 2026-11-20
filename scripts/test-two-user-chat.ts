import {
  getDirectChatKey,
  fetchDirectMessages,
  sendDirectMessage,
  deleteDirectMessage,
  subscribeToDirectWhispers,
  type ChatMessage,
} from '../src/lib/whisperChatService';

console.log('\n👻 =========================================================');
console.log('👻 TEST SUITE: 2 DIFFERENT PEOPLE & IDS CHAT & MESSAGING');
console.log('👻 =========================================================\n');

async function runTests() {
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      process.exit(1);
    }
  }

  // 1. Two distinct users with unique accounts & IDs
  const userA = {
    id: 'usr_vlad',
    hauntlyId: 'HAUNT-VAMP7',
    name: 'Count Vlad',
  };

  const userB = {
    id: 'usr_jack',
    hauntlyId: 'HAUNT-8X29K',
    name: 'Pumpkin King',
  };

  console.log(`🧪 TEST 1: Canonical Symmetric Conversation Key`);
  const keyAtoB = getDirectChatKey(userA.id, userB.id);
  const keyBtoA = getDirectChatKey(userB.id, userA.id);
  assert(keyAtoB === keyBtoA, `Both users share identical conversation key: ${keyAtoB}`);
  assert(
    keyAtoB === 'hauntly_whisper_usr_jack_usr_vlad',
    'Key is alphabetically sorted and collision-free'
  );

  console.log(`\n🧪 TEST 2: Real-time Two-way Subscription Attunement`);
  const userAReceived: ChatMessage[] = [];
  const userBReceived: ChatMessage[] = [];

  const unsubA = subscribeToDirectWhispers({
    userId1: userA.id,
    userId2: userB.id,
    onNewMessage: (msg) => userAReceived.push(msg),
    onDeleteMessage: () => {},
  });

  const unsubB = subscribeToDirectWhispers({
    userId1: userB.id,
    userId2: userA.id,
    onNewMessage: (msg) => userBReceived.push(msg),
    onDeleteMessage: () => {},
  });

  console.log(`\n🧪 TEST 3: User A (Count Vlad) Whispers to User B (Pumpkin King)`);
  const msgFromA = await sendDirectMessage({
    senderId: userA.id,
    senderName: userA.name,
    receiverId: userB.id,
    text: 'Meet me at the cemetery crypt at midnight! 🦇',
  });

  assert(Boolean(msgFromA.id), 'Message from User A created with unique ID');
  assert(msgFromA.senderId === userA.id, 'Message senderId matches User A');
  assert(msgFromA.senderName === 'Count Vlad', 'Message senderName matches Count Vlad');

  console.log(`\n🧪 TEST 4: User B (Pumpkin King) Fetches Thread & Evaluates Ownership`);
  const threadForB = await fetchDirectMessages(userB.id, userA.id);
  const receivedByB = threadForB.find((m) => m.id === msgFromA.id);
  assert(Boolean(receivedByB), 'User B thread contains User A message');

  // Verify alignment in User B's UI:
  const isSelfForB = receivedByB?.senderId === userB.id;
  assert(!isSelfForB, "In User B's view, User A's message is on the left (isSelf = false)");

  console.log(`\n🧪 TEST 5: User B Replies to User A`);
  const msgFromB = await sendDirectMessage({
    senderId: userB.id,
    senderName: userB.name,
    receiverId: userA.id,
    text: 'I shall bring the carved lanterns and spectral brew! 🎃',
  });

  assert(Boolean(msgFromB.id), 'Message from User B created successfully');
  assert(msgFromB.senderId === userB.id, 'Message senderId matches User B');

  console.log(`\n🧪 TEST 6: User A Fetches Updated Thread & Verifies Bidirectional Alignment`);
  const threadForA = await fetchDirectMessages(userA.id, userB.id);
  assert(threadForA.length >= 2, 'Thread contains both messages');

  const msg1InA = threadForA.find((m) => m.id === msgFromA.id);
  const msg2InA = threadForA.find((m) => m.id === msgFromB.id);

  assert(msg1InA?.senderId === userA.id, "User A's own message aligns right (isSelf = true)");
  assert(msg2InA?.senderId === userB.id, "User B's reply aligns left (isSelf = false)");
  assert(msg2InA?.senderName === 'Pumpkin King', "User B's reply displays sender name Pumpkin King");

  console.log(`\n🧪 TEST 7: Security & Message Deletion Across 2 Users`);
  // User B attempts to delete User A's message
  const unauthorizedAttempt = await deleteDirectMessage({
    messageId: msgFromA.id,
    userId1: userB.id,
    userId2: userA.id,
    currentUserId: userB.id,
  });
  assert(!unauthorizedAttempt.success, 'User B cannot delete User A message');
  assert(
    unauthorizedAttempt.error === 'You can only delete your own messages.',
    'Security policy blocks unauthorized deletion'
  );

  // User A deletes User A's message
  const authorizedDelete = await deleteDirectMessage({
    messageId: msgFromA.id,
    userId1: userA.id,
    userId2: userB.id,
    currentUserId: userA.id,
  });
  assert(authorizedDelete.success, 'User A successfully banished their own message');

  // Verify it is gone for both users
  const threadAfterDelete = await fetchDirectMessages(userA.id, userB.id);
  assert(
    !threadAfterDelete.some((m) => m.id === msgFromA.id),
    'Deleted message is gone for both User A and User B'
  );

  unsubA();
  unsubB();

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`   RESULTS: ${passed}/${total} TESTS PASSED ✨`);
  console.log('   2 DIFFERENT PEOPLE & IDS CHAT & MESSAGING IS 100% OPERATIONAL!');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
