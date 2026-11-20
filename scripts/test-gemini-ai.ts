// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE: HAUNTLY GEMINI AI FEATURES
// ─────────────────────────────────────────────────────────────────────────────

import {
  getGeminiApiKey,
  setGeminiApiKey,
  hasGeminiApiKey,
  callGemini,
  geminiTranslate,
  geminiSummarise,
  geminiGhostRewrite,
  geminiSmartReplies,
} from '../src/lib/geminiService';
import { translateText, summariseText } from '../src/lib/aiService';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
  }
}

async function runTestSuite() {
  console.log('\n🔮 ═══════════════════════════════════════════════════════════');
  console.log('   HAUNTLY GEMINI AI TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // ── TEST 1: Gemini API Key Management ──
  console.log('🧪 TEST 1: API Key Config & Storage');
  setGeminiApiKey('AIzaSy_TEST_KEY_GEMINI_HAUNTLY_2026');
  assert(getGeminiApiKey() === 'AIzaSy_TEST_KEY_GEMINI_HAUNTLY_2026', 'Stores and retrieves Gemini API key');
  assert(hasGeminiApiKey() === true, 'hasGeminiApiKey returns true when key is set');

  // Clear key
  setGeminiApiKey('');
  assert(getGeminiApiKey() === '', 'Clears Gemini API key safely');
  assert(hasGeminiApiKey() === false, 'hasGeminiApiKey returns false when key is cleared');

  // ── TEST 2: Translation Service with Spectral Fallback & Gemini Engine ──
  console.log('\n🧪 TEST 2: Translation Service (Multi-Language & Gothic)');
  const spanishRes = await translateText("Let's meet at the haunted castle tonight!", 'es');
  assert(spanishRes.translatedText.length > 5, 'Translates English to Spanish');
  assert(
    spanishRes.translatedText.toLowerCase().includes('castillo') ||
    spanishRes.translatedText.toLowerCase().includes('encontr'),
    'Spanish translation contains accurate vocabulary (castillo/encontrémonos)'
  );
  assert(spanishRes.confidence >= 0.9, 'Translation confidence is high (>= 90%)');

  const gothicRes = await translateText("Let's meet at the castle tonight", 'gothic');
  assert(gothicRes.translatedText.length > 5, 'Translates modern phrase to Gothic Spectral');
  assert(
    gothicRes.translatedText.toLowerCase().includes('rendezvous') ||
    gothicRes.translatedText.toLowerCase().includes('darkened eve') ||
    gothicRes.translatedText.toLowerCase().includes('spectral') ||
    gothicRes.translatedText.toLowerCase().includes('citadel'),
    'Gothic translation includes authentic Victorian horror vocabulary'
  );

  // ── TEST 3: Summarisation Service ──
  console.log('\n🧪 TEST 3: Summarisation & Sentiment Intelligence');
  const summaryRes = await summariseText(
    "Spirits of the shadow realm! We are gathering tonight at the abandoned raven cemetery to begin the midnight ritual. Bring your candles and black cloaks.",
    'standard'
  );
  assert(summaryRes.summary.length > 10, 'Generates comprehensive summary');
  assert(summaryRes.keyPoints.length > 0, 'Extracts structured bullet points');
  assert(summaryRes.sentiment === 'spooky' || summaryRes.sentiment === 'mysterious', 'Accurately classifies sentiment (spooky/mysterious)');
  assert(summaryRes.wordCount.original > summaryRes.wordCount.summary, 'Successfully condenses message length');

  const briefSummary = await summariseText("Are you coming tonight?", 'brief');
  assert(briefSummary.summary.length > 0, 'Generates ultra-brief summary');

  // ── TEST 4: Gemini Ghost Rewrite (Gothic, Vampire, Phantom, Rhyme) ──
  console.log('\n🧪 TEST 4: Ghost Rewrite Styles');
  const gothicRewrite = await geminiGhostRewrite("See you at the party tonight", 'gothic');
  assert(gothicRewrite.rewrittenText.length > 10, 'Generates Gothic Horror rewrite');

  const vampireRewrite = await geminiGhostRewrite("I am waiting for you", 'vampire');
  assert(vampireRewrite.rewrittenText.includes('🩸') || vampireRewrite.rewrittenText.toLowerCase().includes('crypt') || vampireRewrite.rewrittenText.toLowerCase().includes('night'), 'Generates Vampire Lord rewrite with nocturnal lore');

  const rhymeRewrite = await geminiGhostRewrite("Halloween is finally here", 'rhyme');
  assert(rhymeRewrite.rewrittenText.length > 10, 'Generates Spooky Rhyme incantation');

  // ── TEST 5: Gemini Smart Spooky Replies ──
  console.log('\n🧪 TEST 5: Smart Spooky Quick Replies');
  const replies = await geminiSmartReplies("Let's meet at the haunted castle tonight!");
  assert(replies.replies.length === 3, 'Generates exactly 3 quick-replies');
  assert(replies.replies.some(r => r.includes('🎃') || r.includes('🕯️') || r.includes('👻') || r.includes('witching')), 'Quick-replies are themed and spooky');

  // ── TEST 6: Simulated Gemini REST Endpoint Contract ──
  console.log('\n🧪 TEST 6: Gemini REST Endpoint Contract Validation');
  // Verify callGemini throws informative error when API key is missing
  try {
    await callGemini('Hello');
    assert(false, 'Should throw MISSING_GEMINI_KEY when key is empty');
  } catch (err: any) {
    assert(err.message === 'MISSING_GEMINI_KEY', 'callGemini enforces MISSING_GEMINI_KEY check properly');
  }

  // ── Summary ──
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`   RESULTS: ${passedTests}/${totalTests} TESTS PASSED ✨`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
