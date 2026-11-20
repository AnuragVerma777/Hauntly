// ─────────────────────────────────────────────────────────────────────────────
// HAUNTLY GEMINI AI SERVICE
// Powered by Google Gemini (Generative Language API)
// ─────────────────────────────────────────────────────────────────────────────

export interface GeminiConfig {
  apiKey: string;
  model: string;
}

export interface GeminiResponse<T = string> {
  data: T;
  engine: 'gemini' | 'spectral-fallback';
  model: string;
  error?: string;
}

const STORAGE_KEY = 'hauntly_gemini_api_key';
const DEFAULT_MODEL = 'gemini-1.5-flash';
let memoryApiKey = '';

/**
 * Retrieve active Gemini API key from memory, localStorage, client env, or process env
 */
export function getGeminiApiKey(): string {
  if (memoryApiKey) return memoryApiKey;

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored.trim()) return stored.trim();
    }
  } catch {
    // ignore storage access issues
  }

  // Vite client env
  try {
    const metaEnv = (import.meta as any)?.env?.VITE_GEMINI_API_KEY;
    if (metaEnv && metaEnv.trim()) return metaEnv.trim();
  } catch {
    // ignore
  }

  // Node / test environment env
  try {
    const proc = (globalThis as any)?.process;
    if (proc && proc.env) {
      const pKey = proc.env.VITE_GEMINI_API_KEY || proc.env.GEMINI_API_KEY;
      if (pKey && pKey.trim()) return pKey.trim();
    }
  } catch {
    // ignore
  }

  return '';
}

/**
 * Store user-supplied Gemini API key in memory & localStorage
 */
export function setGeminiApiKey(key: string): void {
  memoryApiKey = key ? key.trim() : '';

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (key && key.trim()) {
        localStorage.setItem(STORAGE_KEY, key.trim());
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Check if a valid Gemini API key is configured
 */
export function hasGeminiApiKey(): boolean {
  return Boolean(getGeminiApiKey());
}

/**
 * Direct call to Google Gemini REST endpoint
 */
export async function callGemini(
  prompt: string,
  options?: {
    systemInstruction?: string;
    temperature?: number;
    jsonMode?: boolean;
    model?: string;
    timeoutMs?: number;
  }
): Promise<{ text: string; model: string }> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('MISSING_GEMINI_KEY');
  }

  const model = options?.model || DEFAULT_MODEL;
  const timeoutMs = options?.timeoutMs || 9000;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const bodyPayload: any = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: 1024,
    },
  };

  if (options?.systemInstruction) {
    bodyPayload.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  if (options?.jsonMode) {
    bodyPayload.generationConfig.responseMimeType = 'application/json';
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text();
      let parsedMessage = `Gemini API error (${res.status})`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) {
          parsedMessage = errJson.error.message;
        }
      } catch {
        // use fallback
      }
      throw new Error(parsedMessage);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const textPart = candidate?.content?.parts?.[0]?.text;

    if (!textPart) {
      throw new Error('Gemini returned an empty response.');
    }

    return {
      text: textPart.trim(),
      model,
    };
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('Gemini request timed out after ' + timeoutMs / 1000 + ' seconds.');
    }
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GEMINI HIGH-LEVEL FEATURE IMPLEMENTATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gemini-powered Translation
 */
export async function geminiTranslate(
  text: string,
  targetLangCode: string,
  targetLangName: string = targetLangCode
): Promise<{ translatedText: string; engine: 'gemini' | 'spectral-fallback'; model: string }> {
  const clean = text.trim();
  if (!clean) {
    return { translatedText: '', engine: 'spectral-fallback', model: 'none' };
  }

  // Handle special Gothic dialect with custom system instructions
  const isGothic = targetLangCode.toLowerCase() === 'gothic';
  const targetDesc = isGothic
    ? 'Victorian Gothic horror dialect (e.g. archaic English with 19th-century gothic atmosphere, using words like thou, thy, eve, spectral, phantom, reckoning)'
    : `${targetLangName} (${targetLangCode})`;

  const systemInstruction = `You are the Hauntly Spectral AI Translator. Your job is to translate chat messages into ${targetDesc}.
Preserve any spooky, playful, and conversational tone of Hauntly.
Return ONLY the raw translated text. Do NOT wrap in quotes. Do NOT add notes or explanation.`;

  const prompt = `Translate this chat message into ${targetDesc}:
"${clean}"`;

  try {
    const result = await callGemini(prompt, {
      systemInstruction,
      temperature: 0.3,
    });

    // Strip wrapping quotes if any
    let cleaned = result.text.replace(/^["']|["']$/g, '').trim();
    return {
      translatedText: cleaned,
      engine: 'gemini',
      model: result.model,
    };
  } catch (err) {
    // Propagate or return fallback marker
    throw err;
  }
}

/**
 * Gemini-powered Summarisation & Insight Extraction
 */
export interface GeminiSummaryData {
  summary: string;
  keyPoints: string[];
  sentiment: 'mysterious' | 'urgent' | 'friendly' | 'spooky' | 'neutral';
  wordCount: {
    original: number;
    summary: number;
  };
}

export async function geminiSummarise(
  text: string,
  tone: 'standard' | 'gothic' | 'brief' = 'standard'
): Promise<{ data: GeminiSummaryData; engine: 'gemini' | 'spectral-fallback'; model: string }> {
  const clean = text.trim();
  if (!clean) {
    return {
      data: {
        summary: 'No content to summarise.',
        keyPoints: [],
        sentiment: 'neutral',
        wordCount: { original: 0, summary: 0 },
      },
      engine: 'spectral-fallback',
      model: 'none',
    };
  }

  const systemInstruction = `You are the Hauntly Spectral AI Summariser. You analyze chat messages in a spooky social network.
Analyze the provided chat message and extract concise insights according to the requested tone: "${tone}".
Return valid JSON matching this exact structure:
{
  "summary": "Concise 1-2 sentence overview in ${tone} tone",
  "keyPoints": ["bullet point 1", "bullet point 2"],
  "sentiment": "mysterious" | "urgent" | "friendly" | "spooky" | "neutral"
}`;

  const prompt = `Summarize this message in "${tone}" tone:
"${clean}"`;

  try {
    const result = await callGemini(prompt, {
      systemInstruction,
      jsonMode: true,
      temperature: 0.4,
    });

    let parsed: any;
    try {
      parsed = JSON.parse(result.text);
    } catch {
      // Fallback regex extraction if needed
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse Gemini JSON output.');
      }
    }

    const summaryText = parsed.summary || result.text;
    const keyPoints = Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [];
    const sentiment = ['mysterious', 'urgent', 'friendly', 'spooky', 'neutral'].includes(
      parsed.sentiment
    )
      ? parsed.sentiment
      : 'spooky';

    return {
      data: {
        summary: summaryText,
        keyPoints,
        sentiment,
        wordCount: {
          original: clean.split(/\s+/).filter(Boolean).length,
          summary: summaryText.split(/\s+/).filter(Boolean).length,
        },
      },
      engine: 'gemini',
      model: result.model,
    };
  } catch (err) {
    throw err;
  }
}

/**
 * Gemini-powered Ghost Rewrite (Transforms text into Gothic Horror / Vampire / Phantom style)
 */
export async function geminiGhostRewrite(
  text: string,
  style: 'gothic' | 'vampire' | 'phantom' | 'rhyme' = 'gothic'
): Promise<{ rewrittenText: string; engine: 'gemini' | 'spectral-fallback'; model: string }> {
  const clean = text.trim();
  if (!clean) {
    return { rewrittenText: '', engine: 'spectral-fallback', model: 'none' };
  }

  const stylePrompts = {
    gothic: 'authentic Victorian Gothic horror style with archaic vocabulary (thou, hath, shroud, crypt)',
    vampire: 'suave, seductive vampire aristocrat tone with crimson and nocturnal imagery',
    phantom: 'whispering ethereal apparition tone from beyond the veil',
    rhyme: 'an eerie 2-line rhyming incantation',
  };

  const systemInstruction = `You are Hauntly Ghostwriter, a spectral AI that transforms casual chat into ${stylePrompts[style]}.
Return ONLY the transformed text without quotes or explanation.`;

  const prompt = `Rewrite this message:
"${clean}"`;

  try {
    const result = await callGemini(prompt, {
      systemInstruction,
      temperature: 0.7,
    });

    let cleaned = result.text.replace(/^["']|["']$/g, '').trim();
    return {
      rewrittenText: cleaned,
      engine: 'gemini',
      model: result.model,
    };
  } catch (_err) {
    // Local Spectral Rewrite Fallback
    let fallbackText = clean;
    if (style === 'gothic') {
      fallbackText = `Hark! Doth thy mortal spirit declare: "${clean.replace(/\byou\b/gi, 'thou').replace(/\byour\b/gi, 'thy')}" upon this haunted eve.`;
    } else if (style === 'vampire') {
      fallbackText = `From the crimson crypts of the night: "${clean}"... Come, join us before the dawn breaks. 🩸`;
    } else if (style === 'phantom') {
      fallbackText = `An ethereal apparition drifts across the cold mist, whispering: "${clean}"...`;
    } else if (style === 'rhyme') {
      fallbackText = `When shadows loom and bats take flight,\n"${clean}" into the night! 🔮`;
    }

    return {
      rewrittenText: fallbackText,
      engine: 'spectral-fallback',
      model: 'spectral-v1',
    };
  }
}

/**
 * Gemini-powered Smart Spooky Replies
 */
export async function geminiSmartReplies(
  text: string
): Promise<{ replies: string[]; engine: 'gemini' | 'spectral-fallback'; model: string }> {
  const clean = text.trim();
  if (!clean) {
    return { replies: [], engine: 'spectral-fallback', model: 'none' };
  }

  const systemInstruction = `You are Hauntly Spectral AI. Generate 3 short, witty, spooky quick-replies (1-6 words each) for this chat message.
Return valid JSON array of 3 strings: ["reply1", "reply2", "reply3"]`;

  const prompt = `Chat message: "${clean}"`;

  try {
    const result = await callGemini(prompt, {
      systemInstruction,
      jsonMode: true,
      temperature: 0.8,
    });

    const parsed = JSON.parse(result.text);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return {
        replies: parsed.slice(0, 3).map((s: any) => String(s)),
        engine: 'gemini',
        model: result.model,
      };
    }
    throw new Error('Invalid replies format');
  } catch (_err) {
    // Smart Spooky Replies Fallback
    const lower = clean.toLowerCase();
    let replies: string[];

    if (/meet|castle|party|tonight/i.test(lower)) {
      replies = [
        'Count me in! 🎃',
        'At the witching hour 🕯️',
        'I shall bring my costume! 👻',
      ];
    } else if (/where|location|place/i.test(lower)) {
      replies = [
        'Marked upon the 3D globe 🌍',
        'In the crypt beneath 🏰',
        'Following the spectral compass 🧭',
      ];
    } else {
      replies = [
        'Spooky vibes only! 🦇',
        'The coven agrees 🕯️',
        'Beware the shadows! 👻',
      ];
    }

    return {
      replies,
      engine: 'spectral-fallback',
      model: 'spectral-v1',
    };
  }
}
