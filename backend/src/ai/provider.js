// AI provider abstraction for blueprint generation. Mirrors the reliability
// pattern already used by the code-builder pipeline (backend/server.js's
// BUILDER_TIERS/generator ladder): try the cheap default provider first, but
// escalate across providers on failure instead of retrying a single one that
// may simply be down — so one dead provider (e.g. a decommissioned Groq
// model) degrades gracefully instead of silently masking every generation.

import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const ANTHROPIC_MODEL = process.env.SONNET_MODEL || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

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

let _anthropic;
function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

async function callAnthropic({ system, user, temperature = 0.7 }) {
  const stream = getAnthropic().messages.stream({
    model: ANTHROPIC_MODEL,
    max_tokens: parseInt(process.env.MAX_OUTPUT_TOKENS || '8192', 10),
    temperature,
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: user }],
  });
  const response = await stream.finalMessage();
  const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
  const u = response.usage || {};
  return {
    text,
    tokens_in: (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0),
    tokens_out: u.output_tokens || 0,
    model: ANTHROPIC_MODEL,
  };
}

async function callProvider(entry, args) {
  if (entry.provider === 'groq') return callGroq(args);
  if (entry.provider === 'gemini') return callGemini(args);
  return callAnthropic(args);
}

// Ordered list of { provider, model } to try. De-duplicated by model so a
// provider already tried never repeats. The explicit AI_PROVIDER env (or
// Groq-if-keyed default) leads; Gemini and Anthropic Sonnet follow as
// escalation rungs when their keys are configured — Anthropic last since it's
// the most reliable but priciest of the three.
export function resolveGeneratorLadder() {
  const ladder = [];
  const seen = new Set();
  const push = (entry) => { if (entry && !seen.has(entry.model)) { seen.add(entry.model); ladder.push(entry); } };

  const explicit = process.env.AI_PROVIDER?.toLowerCase();
  if (explicit === 'gemini' && process.env.GEMINI_API_KEY) push({ provider: 'gemini', model: GEMINI_MODEL });
  else if (explicit === 'groq' && process.env.GROQ_API_KEY) push({ provider: 'groq', model: GROQ_MODEL });
  else if (process.env.GROQ_API_KEY) push({ provider: 'groq', model: GROQ_MODEL });
  else if (process.env.GEMINI_API_KEY) push({ provider: 'gemini', model: GEMINI_MODEL });

  if (process.env.GEMINI_API_KEY) push({ provider: 'gemini', model: GEMINI_MODEL });
  if (process.env.ANTHROPIC_API_KEY) push({ provider: 'anthropic', model: ANTHROPIC_MODEL });

  return ladder;
}

// Kept for callers that just want "the" provider without the full ladder
// (e.g. status/health reporting).
function selectProvider() {
  const ladder = resolveGeneratorLadder();
  if (ladder.length === 0) throw new Error('No AI provider configured: set GROQ_API_KEY, GEMINI_API_KEY, or ANTHROPIC_API_KEY');
  return ladder[0].provider;
}

export async function generateJSON(args) {
  const provider = selectProvider();
  return callProvider({ provider }, args);
}

export function activeProviderName() {
  try { return selectProvider(); } catch { return 'none'; }
}

export { callProvider };
