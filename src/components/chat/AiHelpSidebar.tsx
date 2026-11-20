import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Languages,
  FileText,
  Copy,
  Check,
  X,
  Send,
  Wand2,
  ChevronDown,
  Globe,
  Quote,
  Key,
  Ghost,
  MessageSquare,
  Flame,
  ExternalLink,
} from 'lucide-react';
import {
  translateText,
  summariseText,
  geminiGhostRewrite,
  geminiSmartReplies,
  getGeminiApiKey,
  setGeminiApiKey,
  hasGeminiApiKey,
  SUPPORTED_LANGUAGES,
  type TranslationResult,
  type SummaryResult,
} from '../../lib/aiService';

export type AiHelpMode = 'translate' | 'summarise' | 'rewrite' | 'replies';

export interface AiHelpSidebarProps {
  selectedText: string;
  initialMode?: AiHelpMode;
  onClose: () => void;
  onInsertIntoChat?: (text: string) => void;
}

export const AiHelpSidebar: React.FC<AiHelpSidebarProps> = ({
  selectedText,
  initialMode = 'translate',
  onClose,
  onInsertIntoChat,
}) => {
  const [mode, setMode] = useState<AiHelpMode>(initialMode);
  const [inputText, setInputText] = useState(selectedText);
  const [targetLang, setTargetLang] = useState('es');
  const [summaryTone, setSummaryTone] = useState<'standard' | 'gothic' | 'brief'>('standard');
  const [rewriteStyle, setRewriteStyle] = useState<'gothic' | 'vampire' | 'phantom' | 'rhyme'>('gothic');
  const [isLoading, setIsLoading] = useState(false);
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null);
  const [rewriteResult, setRewriteResult] = useState<{ rewrittenText: string; engine: string; model: string } | null>(null);
  const [repliesResult, setRepliesResult] = useState<{ replies: string[]; engine: string; model: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Gemini API Key management
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [hasCustomKey, setHasCustomKey] = useState(false);
  const [keyToast, setKeyToast] = useState<string | null>(null);

  useEffect(() => {
    const k = getGeminiApiKey();
    setHasCustomKey(Boolean(k));
    if (k) setKeyInput(k);
  }, []);

  // Sync when selectedText or initialMode changes
  useEffect(() => {
    if (selectedText) {
      setInputText(selectedText);
      setMode(initialMode);
      executeAi(selectedText, initialMode, targetLang, summaryTone, rewriteStyle);
    }
  }, [selectedText, initialMode]);

  const executeAi = async (
    textToProcess: string,
    targetMode: AiHelpMode,
    lang: string,
    tone: 'standard' | 'gothic' | 'brief',
    style: 'gothic' | 'vampire' | 'phantom' | 'rhyme'
  ) => {
    const clean = textToProcess.trim();
    if (!clean) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (targetMode === 'translate') {
        const res = await translateText(clean, lang);
        setTranslationResult(res);
      } else if (targetMode === 'summarise') {
        const res = await summariseText(clean, tone);
        setSummaryResult(res);
      } else if (targetMode === 'rewrite') {
        const res = await geminiGhostRewrite(clean, style);
        setRewriteResult(res);
      } else if (targetMode === 'replies') {
        const res = await geminiSmartReplies(clean);
        setRepliesResult(res);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'AI Processing interrupted by ethereal static.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (newMode: AiHelpMode) => {
    setMode(newMode);
    executeAi(inputText, newMode, targetLang, summaryTone, rewriteStyle);
  };

  const handleLangChange = (newLang: string) => {
    setTargetLang(newLang);
    if (mode === 'translate') {
      executeAi(inputText, 'translate', newLang, summaryTone, rewriteStyle);
    }
  };

  const handleToneChange = (newTone: 'standard' | 'gothic' | 'brief') => {
    setSummaryTone(newTone);
    if (mode === 'summarise') {
      executeAi(inputText, 'summarise', targetLang, newTone, rewriteStyle);
    }
  };

  const handleStyleChange = (newStyle: 'gothic' | 'vampire' | 'phantom' | 'rhyme') => {
    setRewriteStyle(newStyle);
    if (mode === 'rewrite') {
      executeAi(inputText, 'rewrite', targetLang, summaryTone, newStyle);
    }
  };

  const handleCopy = (text: string, id: string = 'main') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleInsertText = (text: string) => {
    if (!text) return;
    if (onInsertIntoChat) {
      onInsertIntoChat(text);
    }
    // Also dispatch global event for cross-component sync
    window.dispatchEvent(
      new CustomEvent('hauntly_insert_chat_text', {
        detail: { text },
      })
    );
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    setGeminiApiKey(keyInput.trim());
    const configured = hasGeminiApiKey();
    setHasCustomKey(configured);
    setKeyToast(configured ? 'Gemini API key linked!' : 'Key removed.');
    setTimeout(() => setKeyToast(null), 2500);
    // Re-run current AI mode with newly active Gemini key
    executeAi(inputText, mode, targetLang, summaryTone, rewriteStyle);
  };

  const selectedLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang) || SUPPORTED_LANGUAGES[0];

  return (
    <div
      className="w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col border-l border-purple-900/40 overflow-hidden relative z-30 animate-fadeIn"
      style={{
        background: 'linear-gradient(180deg, #130728 0%, #0c031c 50%, #070110 100%)',
      }}
    >
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-purple-900/40 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-800 to-indigo-700 border border-purple-400/50 flex items-center justify-center text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]">
            <Sparkles className="w-4 h-4 text-[#d4ff32]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Spectral AI
              </h3>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 text-purple-200 font-bold border border-purple-400/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Gemini
              </span>
            </div>
            <p className="text-[10px] text-purple-300/60 font-mono">Powered by Google Gemini</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Key Settings Toggle */}
          <button
            type="button"
            onClick={() => setShowKeyConfig((prev) => !prev)}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
              showKeyConfig || hasCustomKey
                ? 'bg-purple-800 text-[#d4ff32] border-purple-500'
                : 'bg-purple-950/60 text-purple-400 hover:text-white border-purple-900/40'
            }`}
            title="Configure Gemini API Key"
          >
            <Key className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-purple-950/60 text-purple-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-purple-900/40"
            title="Close AI Help"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── GEMINI API KEY CONFIG DRAWER ── */}
      {showKeyConfig && (
        <div className="px-4 py-3 bg-[#0d041a] border-b border-purple-800/50 space-y-2 animate-fadeIn text-xs">
          <div className="flex items-center justify-between text-purple-200 font-semibold">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Google Gemini Setup
            </span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                hasCustomKey
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                  : 'bg-amber-950 text-amber-300 border border-amber-800/50'
              }`}
            >
              {hasCustomKey ? 'Key Active' : 'Fallback Mode'}
            </span>
          </div>

          <form onSubmit={handleSaveKey} className="space-y-2">
            <input
              type="password"
              placeholder="Paste Gemini API Key (AIzaSy...)"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-purple-700/60 text-white placeholder-purple-400/40 font-mono text-[11px] focus:outline-none focus:border-[#d4ff32]"
            />
            <div className="flex items-center justify-between gap-2">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-mono"
              >
                Get free key <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <div className="flex items-center gap-1">
                {hasCustomKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setKeyInput('');
                      setGeminiApiKey('');
                      setHasCustomKey(false);
                      setKeyToast('Key cleared.');
                      setTimeout(() => setKeyToast(null), 2000);
                    }}
                    className="px-2 py-1 rounded bg-purple-950 text-purple-300 hover:text-white text-[10px] cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[10px] font-bold cursor-pointer shadow-sm"
                >
                  Save Key
                </button>
              </div>
            </div>
            {keyToast && (
              <p className="text-[10px] text-emerald-400 font-mono animate-fadeIn">{keyToast}</p>
            )}
          </form>
        </div>
      )}

      {/* ── 4 TABS: TRANSLATE / SUMMARISE / REWRITE / REPLIES ── */}
      <div className="px-5 pt-3 pb-2 flex-shrink-0">
        <div className="p-1 rounded-2xl bg-[#090314] border border-purple-900/50 grid grid-cols-4 gap-1">
          <button
            type="button"
            onClick={() => handleModeChange('translate')}
            className={`py-1.5 px-1 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              mode === 'translate'
                ? 'bg-purple-700 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                : 'text-purple-400 hover:text-white hover:bg-purple-950/40'
            }`}
          >
            <Languages className="w-3 h-3" />
            <span>Translate</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('summarise')}
            className={`py-1.5 px-1 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              mode === 'summarise'
                ? 'bg-purple-700 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                : 'text-purple-400 hover:text-white hover:bg-purple-950/40'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>Summary</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('rewrite')}
            className={`py-1.5 px-1 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              mode === 'rewrite'
                ? 'bg-purple-700 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                : 'text-purple-400 hover:text-white hover:bg-purple-950/40'
            }`}
          >
            <Ghost className="w-3 h-3" />
            <span>Rewrite</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('replies')}
            className={`py-1.5 px-1 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              mode === 'replies'
                ? 'bg-purple-700 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                : 'text-purple-400 hover:text-white hover:bg-purple-950/40'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Replies</span>
          </button>
        </div>
      </div>

      {/* ── SCROLLABLE BODY ── */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
        {/* Selected Message Card */}
        <div className="rounded-2xl p-3 bg-[#0a0316] border border-purple-900/40 space-y-1.5 shadow-inner">
          <div className="flex items-center justify-between text-[11px] text-purple-400/80 font-mono">
            <span className="flex items-center gap-1 font-semibold">
              <Quote className="w-3 h-3 text-purple-400" />
              Selected Message
            </span>
            <span>{inputText.split(/\s+/).filter(Boolean).length} words</span>
          </div>
          <div className="text-xs text-white leading-relaxed italic bg-purple-950/20 p-2.5 rounded-xl border border-purple-900/30 break-words">
            &ldquo;{inputText}&rdquo;
          </div>
        </div>

        {/* ── MODE 1: TRANSLATE CONTROLS ── */}
        {mode === 'translate' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-purple-300 flex items-center justify-between">
                <span>Select Target Language:</span>
                <span className="text-[10px] text-purple-400/60 font-mono">
                  {selectedLangObj.flag} {selectedLangObj.name}
                </span>
              </label>
              <div className="relative">
                <select
                  value={targetLang}
                  onChange={(e) => handleLangChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e041d] border border-purple-700/50 text-xs text-white appearance-none outline-none focus:border-[#d4ff32] focus:ring-1 focus:ring-[#d4ff32] font-medium transition-all cursor-pointer"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-[#120625] text-white">
                      {lang.flag} {lang.name} ({lang.nativeName})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-purple-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Quick Language Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {SUPPORTED_LANGUAGES.slice(0, 5).map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleLangChange(l.code)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                    targetLang === l.code
                      ? 'bg-purple-600 text-white font-bold shadow-sm'
                      : 'bg-purple-950/40 text-purple-300 hover:bg-purple-900/40'
                  }`}
                >
                  {l.flag} {l.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleLangChange('gothic')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                  targetLang === 'gothic'
                    ? 'bg-amber-600 text-white font-bold shadow-sm'
                    : 'bg-purple-950/40 text-amber-300 hover:bg-purple-900/40'
                }`}
              >
                🕯️ Gothic
              </button>
            </div>
          </div>
        )}

        {/* ── MODE 2: SUMMARISE CONTROLS ── */}
        {mode === 'summarise' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-purple-300">
                Summary Tone & Depth:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'standard', label: 'Standard' },
                  { id: 'brief', label: 'Ultra Brief' },
                  { id: 'gothic', label: 'Victorian 📜' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleToneChange(t.id as any)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-medium transition-all text-center cursor-pointer ${
                      summaryTone === t.id
                        ? 'bg-purple-700 text-white font-bold shadow-sm border border-purple-500/50'
                        : 'bg-[#0e041d] text-purple-300/70 hover:bg-purple-950/60'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MODE 3: GHOST REWRITE CONTROLS ── */}
        {mode === 'rewrite' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-purple-300 flex items-center justify-between">
                <span>Transmutation Style:</span>
                <span className="text-[10px] font-mono text-purple-400">Gemini Spectral</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'gothic', label: 'Gothic Horror 📜' },
                  { id: 'vampire', label: 'Vampire Lord 🧛' },
                  { id: 'phantom', label: 'Phantom Whisper 👻' },
                  { id: 'rhyme', label: 'Spooky Rhyme 🔮' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleStyleChange(s.id as any)}
                    className={`py-2 px-2.5 rounded-xl text-[11px] font-medium transition-all text-left cursor-pointer border ${
                      rewriteStyle === s.id
                        ? 'bg-purple-700 text-white font-bold border-purple-400 shadow-[0_0_12px_rgba(147,51,234,0.3)]'
                        : 'bg-[#0e041d] text-purple-300/80 border-purple-900/40 hover:bg-purple-950/60'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MODE 4: SMART REPLIES CONTROLS ── */}
        {mode === 'replies' && (
          <div className="space-y-1">
            <p className="text-[11px] text-purple-300/80">
              Instant spooky replies generated by Google Gemini:
            </p>
          </div>
        )}

        {/* ── AI PROCESSING LOADER ANIMATION ── */}
        {isLoading && (
          <div className="p-6 rounded-2xl bg-purple-950/30 border border-purple-800/40 flex flex-col items-center justify-center text-center space-y-3 animate-pulse">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-purple-500/30 border-t-[#d4ff32] animate-spin" />
              <Sparkles className="w-5 h-5 text-[#d4ff32] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                {mode === 'translate'
                  ? 'Gemini transmuting dialect...'
                  : mode === 'summarise'
                  ? 'Gemini distilling spectral essence...'
                  : mode === 'rewrite'
                  ? 'Gemini channeling gothic spirits...'
                  : 'Gemini conjuring replies...'}
              </p>
              <p className="text-[10px] text-purple-400/60 font-mono">Google Gemini 1.5 Flash</p>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* ── AI RESULT: TRANSLATION ── */}
        {!isLoading && mode === 'translate' && translationResult && (
          <div className="rounded-2xl p-4 bg-gradient-to-b from-[#140828] to-[#0c031a] border border-purple-600/50 space-y-3 shadow-lg animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-purple-900/40">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#d4ff32]" />
                Translated to {selectedLangObj.name}
              </span>
              <span className="text-[10px] font-mono text-cyan-300 bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-700/50 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                {translationResult.engine === 'gemini' ? 'Gemini AI' : 'Spectral'}
              </span>
            </div>

            <div className="text-xs font-medium text-white leading-relaxed p-3 rounded-xl bg-[#080210] border border-purple-900/40 shadow-inner select-all">
              {translationResult.translatedText}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopy(translationResult.translatedText, 'translate')}
                className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/70 border border-purple-800/50 text-xs text-purple-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copied === 'translate' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-purple-400" />
                )}
                <span>{copied === 'translate' ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleInsertText(translationResult.translatedText)}
                className="px-3 py-1.5 rounded-xl bg-[#d4ff32] hover:bg-[#bbf019] text-black text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(212,255,50,0.3)] transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Use in Chat</span>
              </button>
            </div>
          </div>
        )}

        {/* ── AI RESULT: SUMMARISE ── */}
        {!isLoading && mode === 'summarise' && summaryResult && (
          <div className="rounded-2xl p-4 bg-gradient-to-b from-[#140828] to-[#0c031a] border border-purple-600/50 space-y-3 shadow-lg animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-purple-900/40">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-[#d4ff32]" />
                Summary Insights
              </span>
              <span className="text-[10px] font-mono text-purple-300 uppercase px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800/50 flex items-center gap-1">
                <Flame className="w-2.5 h-2.5 text-amber-400" />
                {summaryResult.sentiment}
              </span>
            </div>

            {/* Executive Summary */}
            <div className="text-xs font-medium text-white leading-relaxed p-3 rounded-xl bg-[#080210] border border-purple-900/40 shadow-inner select-all">
              {summaryResult.summary}
            </div>

            {/* Key Points */}
            {summaryResult.keyPoints.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-purple-300">Key Points:</span>
                <ul className="space-y-1">
                  {summaryResult.keyPoints.map((pt, i) => (
                    <li
                      key={i}
                      className="text-xs text-neutral-300 flex items-start gap-1.5 leading-snug"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d4ff32] mt-1.5 shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Engine & Stats */}
            <div className="flex items-center justify-between text-[10px] text-purple-400/70 font-mono pt-1">
              <span>{summaryResult.wordCount.original} orig. words &rarr; {summaryResult.wordCount.summary} words</span>
              <span className="text-cyan-400">{summaryResult.engine === 'gemini' ? '✨ Gemini' : 'Spectral'}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopy(summaryResult.summary, 'summary')}
                className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/70 border border-purple-800/50 text-xs text-purple-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copied === 'summary' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-purple-400" />
                )}
                <span>{copied === 'summary' ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleInsertText(summaryResult.summary)}
                className="px-3 py-1.5 rounded-xl bg-[#d4ff32] hover:bg-[#bbf019] text-black text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(212,255,50,0.3)] transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Use in Chat</span>
              </button>
            </div>
          </div>
        )}

        {/* ── AI RESULT: GHOST REWRITE ── */}
        {!isLoading && mode === 'rewrite' && rewriteResult && (
          <div className="rounded-2xl p-4 bg-gradient-to-b from-[#140828] to-[#0c031a] border border-purple-600/50 space-y-3 shadow-lg animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-purple-900/40">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Ghost className="w-3.5 h-3.5 text-[#d4ff32]" />
                Ghost Transmutation ({rewriteStyle})
              </span>
              <span className="text-[10px] font-mono text-cyan-300 bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-700/50 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                {rewriteResult.engine === 'gemini' ? 'Gemini AI' : 'Spectral'}
              </span>
            </div>

            <div className="text-xs font-medium text-white leading-relaxed p-3.5 rounded-xl bg-[#080210] border border-purple-900/40 shadow-inner select-all whitespace-pre-wrap font-serif italic">
              &ldquo;{rewriteResult.rewrittenText}&rdquo;
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopy(rewriteResult.rewrittenText, 'rewrite')}
                className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/70 border border-purple-800/50 text-xs text-purple-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copied === 'rewrite' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-purple-400" />
                )}
                <span>{copied === 'rewrite' ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleInsertText(rewriteResult.rewrittenText)}
                className="px-3 py-1.5 rounded-xl bg-[#d4ff32] hover:bg-[#bbf019] text-black text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(212,255,50,0.3)] transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Use in Chat</span>
              </button>
            </div>
          </div>
        )}

        {/* ── AI RESULT: SMART REPLIES ── */}
        {!isLoading && mode === 'replies' && repliesResult && (
          <div className="space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between text-[11px] text-purple-300 font-semibold px-1">
              <span>Suggested Responses:</span>
              <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                {repliesResult.engine === 'gemini' ? 'Gemini 1.5' : 'Spectral'}
              </span>
            </div>

            {repliesResult.replies.map((reply, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-gradient-to-r from-[#140828] to-[#0d041c] border border-purple-700/50 hover:border-[#d4ff32]/60 transition-all flex items-center justify-between gap-2 group shadow-sm"
              >
                <span className="text-xs text-white font-medium flex-1">
                  {reply}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(reply, `reply-${idx}`)}
                    className="p-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 hover:text-white transition-colors cursor-pointer"
                    title="Copy response"
                  >
                    {copied === `reply-${idx}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertText(reply)}
                    className="px-2.5 py-1 rounded-lg bg-[#d4ff32] hover:bg-[#bbf019] text-black font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shadow-sm"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
