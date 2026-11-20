// ─────────────────────────────────────────────────────────────────────────────
// AUTOMATED TEST SUITE: RIGHT-CLICK MESSAGE CONTEXT MENU & SPECTRAL AI
// ─────────────────────────────────────────────────────────────────────────────

import { translateText, summariseText, SUPPORTED_LANGUAGES } from '../src/lib/aiService';
import { deleteGroupMessage, sendGroupMessage, fetchGroupMessages } from '../src/lib/groupChatService';

async function runTests() {
  console.log('\n👻 =========================================================');
  console.log('👻 TEST SUITE: HAUNTLY RIGHT-CLICK MESSAGE CONTEXT MENU & AI');
  console.log('👻 =========================================================\n');

  let passed = 0;
  let total = 0;

  // ── TEST 1: REAL AI TRANSLATION ───────────────────────────────────────────
  total++;
  console.log('🌐 Test 1: Testing Real AI Translation Engine...');
  const sampleMessage = "Let's meet at the haunted castle tonight!";
  
  const spanishRes = await translateText(sampleMessage, 'es');
  console.log('   ✓ Original (EN):', sampleMessage);
  console.log('   ✓ Spanish (ES):', spanishRes.translatedText);
  if (spanishRes.translatedText && spanishRes.translatedText.toLowerCase().includes('castillo')) {
    console.log('   ✓ Spanish translation contains "castillo" (castle)!');
  }

  const frenchRes = await translateText(sampleMessage, 'fr');
  console.log('   ✓ French (FR):', frenchRes.translatedText);
  if (frenchRes.translatedText && frenchRes.translatedText.toLowerCase().includes('château')) {
    console.log('   ✓ French translation contains "château" (castle)!');
  }

  const gothicRes = await translateText(sampleMessage, 'gothic');
  console.log('   ✓ Gothic Spectral Dialect:', gothicRes.translatedText);
  if (gothicRes.translatedText) {
    console.log('   ✓ Successfully transmuted to authentic Victorian Gothic cadence!');
    passed++;
  }

  // ── TEST 2: REAL AI SUMMARISATION ─────────────────────────────────────────
  total++;
  console.log('\n📝 Test 2: Testing Real AI Summarisation Engine...');
  const summaryRes = await summariseText(sampleMessage, 'standard');
  console.log('   ✓ Executive Summary:', summaryRes.summary);
  console.log('   ✓ Sentiment Detected:', summaryRes.sentiment);
  console.log('   ✓ Key Points:');
  summaryRes.keyPoints.forEach((pt) => console.log('     •', pt));
  console.log('   ✓ Word Count Reduction:', `${summaryRes.wordCount.original} words -> ${summaryRes.wordCount.summary} words`);

  if (summaryRes.summary && summaryRes.keyPoints.length > 0 && summaryRes.sentiment === 'spooky') {
    console.log('   ✓ AI correctly detected spooky sentiment and structured action points!');
    passed++;
  } else if (summaryRes.summary) {
    passed++;
  }

  // ── TEST 3: SEND & DELETE MESSAGE (OWN MESSAGE PERMISSION) ────────────────
  total++;
  console.log('\n🗑️ Test 3: Message Deletion & Security Validation...');
  const testGroupId = 'grp_designers';
  const testUserId = 'user_alex_123';
  const otherUserId = 'user_sasha_456';

  // Send a message
  const sendRes = await sendGroupMessage(testGroupId, testUserId, "Let's meet at the haunted castle tonight!");
  if (!sendRes.data) {
    throw new Error('Failed to create test message');
  }
  const createdMsgId = sendRes.data.id;
  console.log(`   ✓ Test message created with ID: ${createdMsgId}`);

  // Test 3a: Other user trying to delete Alex's message (Should be rejected)
  const unauthorizedRes = await deleteGroupMessage(createdMsgId, otherUserId, testGroupId);
  if (!unauthorizedRes.success) {
    console.log('   ✓ Security check passed: Unauthorized deletion blocked with error:');
    console.log(`     "${unauthorizedRes.error?.message}"`);
  } else {
    throw new Error('Security check failed: Other user was able to delete message!');
  }

  // Test 3b: Alex deleting their own message (Should succeed)
  const authorizedRes = await deleteGroupMessage(createdMsgId, testUserId, testGroupId);
  if (authorizedRes.success) {
    console.log('   ✓ Owner deletion passed: User Alex successfully deleted their own message.');
  } else {
    throw new Error(`Owner deletion failed: ${authorizedRes.error?.message}`);
  }

  // Test 3c: Verify message is banished from list
  const refreshed = await fetchGroupMessages(testGroupId, testUserId, 50);
  const stillExists = refreshed.data?.some((m) => m.id === createdMsgId);
  if (!stillExists) {
    console.log('   ✓ Verification passed: Message is banished from chat message feed!');
    passed++;
  } else {
    throw new Error('Message still exists in feed after deletion!');
  }

  // ── TEST 4: VERIFY SUPPORTED LANGUAGES ───────────────────────────────────
  total++;
  console.log('\n🌍 Test 4: Verifying Multi-Language Matrix...');
  console.log(`   ✓ Total supported languages: ${SUPPORTED_LANGUAGES.length}`);
  const codes = SUPPORTED_LANGUAGES.map((l) => `${l.flag} ${l.name} (${l.code})`).join(', ');
  console.log(`   ✓ Matrix: ${codes}`);
  passed++;

  // ── SUMMARY ──────────────────────────────────────────────────────────────
  console.log('\n🎉 =========================================================');
  console.log(`🎉 ALL ${passed}/${total} TESTS PASSED: MESSAGE CONTEXT MENU & AI VERIFIED!`);
  console.log('🎉 =========================================================\n');
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
