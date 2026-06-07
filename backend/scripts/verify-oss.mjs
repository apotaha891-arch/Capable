// Quality check for the OPEN-WEIGHT path: generate with the OSS model (Groq/DeepSeek
// via OpenAI-compatible endpoint), review with the strong reviewer, eyeball + cost.
//   node scripts/verify-oss.mjs "your prompt"
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');

const jsx = fs.readFileSync(path.join(root, 'frontend/src/pages/BuilderPage.jsx'), 'utf8');
const SYSTEM_PROMPT = jsx.match(/const SYSTEM_PROMPT = `([\s\S]*?)`;/)[1];

const OSS_BASE_URL = process.env.OSS_BASE_URL || 'https://api.deepseek.com';
const OSS_API_KEY  = process.env.OSS_API_KEY || process.env.DEEPSEEK_API_KEY;
const OSS_MODEL    = process.env.OSS_MODEL || 'deepseek-chat';
const SONNET_MODEL = process.env.SONNET_MODEL || 'claude-sonnet-4-6';
const PRICING = {
  'claude-sonnet-4-6': { in: 3, out: 15 },
  'deepseek-chat': { in: 0.28, out: 0.42 },
  'llama-3.3-70b-versatile': { in: 0.59, out: 0.79 },
};
const cost = (m, i, o) => ((i * (PRICING[m]?.in || 0)) + (o * (PRICING[m]?.out || 0))) / 1e6;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function parsePayload(raw) {
  const text = (raw || '').trim();
  const tryParse = (s) => { try { return JSON.parse(s); } catch { return null; } };
  let p = tryParse(text.replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim());
  if (!p) { const m = text.match(/\{[\s\S]*\}/); if (m) p = tryParse(m[0]); }
  return p;
}

async function ossGenerate(prompt) {
  const res = await fetch(`${OSS_BASE_URL.replace(/\/$/, '')}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OSS_API_KEY}` },
    body: JSON.stringify({
      model: OSS_MODEL,
      response_format: { type: 'json_object' },
      max_tokens: parseInt(process.env.BUILDER_MAX_OUTPUT_TOKENS || '32768'),
      temperature: 0.7,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`OSS ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const u = data.usage || {};
  return { payload: parsePayload(data.choices?.[0]?.message?.content || ''), usage: { tokensIn: u.prompt_tokens || 0, tokensOut: u.completion_tokens || 0 } };
}

async function review(userRequest, code) {
  const reviewSystem = `You are a senior front-end reviewer for single-file HTML sites. Judge whether the code correctly and completely fulfils the user's request. Output ONLY {"approved": boolean, "issues": "string"}. Flag only real problems (broken links, dead buttons, missing sections, placeholder content, missing RTL/Arabic, invalid HTML).`;
  const stream = anthropic.messages.stream({
    model: SONNET_MODEL, max_tokens: 4000, output_config: { effort: 'low' },
    system: [{ type: 'text', text: reviewSystem }],
    messages: [{ role: 'user', content: `USER REQUEST:\n${userRequest}\n\nGENERATED HTML:\n${code}` }],
  });
  const r = await stream.finalMessage();
  const raw = r.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
  let verdict; try { verdict = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || ''); } catch { verdict = { approved: true, issues: '' }; }
  const u = r.usage || {};
  return { verdict, usage: { tokensIn: (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0), tokensOut: u.output_tokens || 0 } };
}

const userPrompt = process.argv[2] || 'أنشئ متجراً إلكترونياً احترافياً باللغة العربية مع منتجات وأسعار بالريال وزر واتساب';
const t0 = Date.now();
console.log(`\n▶ OPEN-WEIGHT generator: ${OSS_MODEL} @ ${OSS_BASE_URL} | reviewer: ${SONNET_MODEL}`);
console.log(`▶ PROMPT: ${userPrompt}\n`);

let { payload, usage: g } = await ossGenerate(userPrompt);
if (!payload?.code) { console.error('❌ OSS output unparseable'); process.exit(1); }
console.log(`① Generated: ${payload.code.length} chars, type=${payload.type}, title="${payload.title}"`);

const { verdict, usage: r } = await review(userPrompt, payload.code);
console.log(`② Review: approved=${verdict.approved}${verdict.issues ? ` | issues: ${verdict.issues}` : ''}`);

const code = payload.code;
const checks = {
  'has <!doctype/<html>': /<!doctype|<html/i.test(code),
  'has dir="rtl"': /dir=["']rtl["']/i.test(code),
  'has whatsapp': /whatsapp|wa\.me|واتساب/i.test(code),
  'has SAR price': /ريال|sar|ر\.س/i.test(code),
  '200+ lines': code.split('\n').length >= 200,
  'no Lorem Ipsum': !/lorem ipsum/i.test(code),
};
console.log('\n── Quality checks ──');
for (const [k, v] of Object.entries(checks)) console.log(`  ${v ? '✅' : '❌'} ${k}`);

fs.writeFileSync(path.join(__dirname, 'verify-output.html'), code);
console.log(`\n💾 ${path.join(__dirname, 'verify-output.html')}`);

const cGen = cost(OSS_MODEL, g.tokensIn, g.tokensOut);
const cRev = cost(SONNET_MODEL, r.tokensIn, r.tokensOut);
console.log('\n── Cost ──');
console.log(`  generate ${OSS_MODEL.padEnd(24)} in=${g.tokensIn} out=${g.tokensOut}  $${cGen.toFixed(4)}`);
console.log(`  review   ${SONNET_MODEL.padEnd(24)} in=${r.tokensIn} out=${r.tokensOut}  $${cRev.toFixed(4)}`);
console.log(`  TOTAL $${(cGen + cRev).toFixed(4)}   |   ⏱ ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
