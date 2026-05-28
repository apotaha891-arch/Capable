// AI provider abstraction. Groq is primary (per spec §8.3); Gemini is fallback
// so we can ship Phase 1 before a Groq key exists. Together AI / OpenAI can be
// added by exporting another callXxx() and adding it to PROVIDERS.

import { GoogleGenerativeAI } from '@google/generative-ai';

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

async function callGroq({ system, user, temperature = 0.7 }) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      temperature,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq API ${res.status}: ${body}`);
  }

  const data = await res.json();
  return {
    text: data.choices?.[0]?.message?.content ?? '',
    tokens_in: data.usage?.prompt_tokens ?? 0,
    tokens_out: data.usage?.completion_tokens ?? 0,
    model: GROQ_MODEL,
  };
}

let _gemini;
function getGemini() {
  if (!_gemini) _gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return _gemini;
}

async function callGemini({ system, user, temperature = 0.7 }) {
  const model = getGemini().getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: system,
    generationConfig: {
      temperature,
      responseMimeType: 'application/json',
      maxOutputTokens: parseInt(process.env.MAX_OUTPUT_TOKENS || '8192', 10),
    },
  });
  const result = await model.generateContent(user);
  const response = await result.response;
  return {
    text: response.text(),
    tokens_in: response.usageMetadata?.promptTokenCount ?? 0,
    tokens_out: response.usageMetadata?.candidatesTokenCount ?? 0,
    model: GEMINI_MODEL,
  };
}

// Selection: explicit AI_PROVIDER env wins; otherwise Groq if keyed, else Gemini.
function selectProvider() {
  const explicit = process.env.AI_PROVIDER?.toLowerCase();
  if (explicit === 'groq' || explicit === 'gemini') return explicit;
  if (process.env.GROQ_API_KEY) return 'groq';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  throw new Error('No AI provider configured: set GROQ_API_KEY or GEMINI_API_KEY');
}

export async function generateJSON(args) {
  const provider = selectProvider();
  if (provider === 'groq') return callGroq(args);
  return callGemini(args);
}

export function activeProviderName() {
  try { return selectProvider(); } catch { return 'none'; }
}
