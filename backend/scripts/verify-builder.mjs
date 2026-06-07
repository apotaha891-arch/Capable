// One-shot quality check for the new Builder flow: Gemini generates → Opus/Sonnet
// reviews → Gemini revises. Mirrors the /api/ai/generate orchestration but runs
// standalone (no DB/auth) so we can eyeball the output before shipping.
//   node scripts/verify-builder.mjs "your prompt here"
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');

// Pull the real production system prompt straight out of the Builder page so the
// test exercises exactly what users get.
const jsx = fs.readFileSync(path.join(root, 'frontend/src/pages/BuilderPage.jsx'), 'utf8');
const SYSTEM_PROMPT = jsx.match(/const SYSTEM_PROMPT = `([\s\S]*?)`;/)[1];

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8';
const PRICING = {
  'claude-opus-4-8': { in: 15, out: 75 },
  'claude-sonnet-4-6': { in: 3, out: 15 },
  'gemini-flash-latest': { in: 0.3, out: 2.5 },
};
const cost = (m, i, o) => ((i * (PRICING[m]?.in || 0)) + (o * (PRICING[m]?.out || 0))) / 1e6;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function parseBuilderPayload(raw) {
  const text = (raw || '').trim();
  const tryParse = (s) => { try { return JSON.parse(s); } catch { return null; } };
  let p = tryParse(text.replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim());
  if (!p) { const m = text.match(/\{[\s\S]*\}/); if (m) p = tryParse(m[0]); }
  return p && typeof p.code === 'string' ? p : null;
}
const asText = (c) => (typeof c === 'string' ? c : JSON.stringify(c));

async function geminiBuild(messages, extra) {
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL, systemInstruction: SYSTEM_PROMPT });
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: asText(m.content) }],
  }));
  let prompt = asText(messages[messages.length - 1].content);
  if (extra) prompt += `\n\n${extra}`;
  const chat = model.startChat({
    history,
    generationConfig: {
      maxOutputTokens: parseInt(process.env.BUILDER_MAX_OUTPUT_TOKENS || '32768'),
      temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
      responseMimeType: 'application/json',
    },
  });
  const r = await (await chat.sendMessage(prompt)).response;
  const u = r.usageMetadata || {};
  return { payload: parseBuilderPayload(r.text()), usage: { tokensIn: u.promptTokenCount || 0, tokensOut: u.candidatesTokenCount || 0 } };
}

async function review(userRequest, code) {
  const reviewSystem = `You are a senior front-end reviewer for single-file HTML sites. A junior dev (Gemini) wrote the code. Judge whether it correctly and completely fulfils the user's request.
Output ONLY a JSON object: {"approved": boolean, "issues": "string"}.
- approved=true and issues="" when the site is good enough to ship.
- approved=false with a SHORT, specific, actionable list of fixes otherwise.
Flag only real problems: broken/empty links and anchors, buttons or forms that do nothing, sections the user asked for that are missing, broken or non-responsive layout, Lorem Ipsum or placeholder content, missing RTL/Arabic when the content is Arabic, invalid HTML. Do NOT nitpick subjective styling. Keep "issues" under 120 words.`;
  const stream = anthropic.messages.stream({
    model: CLAUDE_MODEL, max_tokens: 6000, output_config: { effort: 'low' },
    system: [{ type: 'text', text: reviewSystem }],
    messages: [{ role: 'user', content: `USER REQUEST:\n${userRequest}\n\nGENERATED HTML:\n${code}` }],
  });
  const r = await stream.finalMessage();
  const raw = r.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
  let verdict; try { verdict = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || ''); } catch { verdict = { approved: true, issues: '' }; }
  const u = r.usage || {};
  const tokensIn = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
  return { verdict, raw, usage: { tokensIn, tokensOut: u.output_tokens || 0 } };
}

const userPrompt = process.argv[2] || 'أنشئ متجراً إلكترونياً احترافياً باللغة العربية مع منتجات وأسعار بالريال وزر واتساب';
const log = [];
const t0 = Date.now();

console.log(`\n▶ PROMPT: ${userPrompt}`);
console.log(`▶ Generator: ${GEMINI_MODEL} | Reviewer: ${CLAUDE_MODEL}\n`);

let { payload, usage: g1 } = await geminiBuild([{ role: 'user', content: userPrompt }]);
log.push([GEMINI_MODEL, 'gemini_generate', g1]);
if (!payload) { console.error('❌ Gemini output unparseable'); process.exit(1); }
console.log(`① Gemini generated: ${payload.code.length} chars, type=${payload.type}, title="${payload.title}"`);

const { verdict, usage: rUsage } = await review(userPrompt, payload.code);
log.push([CLAUDE_MODEL, 'review', rUsage]);
console.log(`② Review: approved=${verdict.approved}${verdict.issues ? ` | issues: ${verdict.issues}` : ''}`);

if (verdict.approved === false && verdict.issues) {
  const prior = { role: 'assistant', content: JSON.stringify({ message: payload.message, code: payload.code }) };
  const extra = `A senior reviewer found these issues with your previous output. Return the COMPLETE corrected single-file site in the exact same JSON format, fixing ONLY these issues:\n${verdict.issues}`;
  const rev = await geminiBuild([{ role: 'user', content: userPrompt }, prior], extra);
  log.push([GEMINI_MODEL, 'gemini_revise', rev.usage]);
  if (rev.payload) payload = rev.payload;
  console.log(`③ Gemini revised: ${payload.code.length} chars`);
}

// Quality assertions
const code = payload.code;
const checks = {
  'has <!doctype/<html>': /<!doctype|<html/i.test(code),
  'has dir="rtl"': /dir=["']rtl["']/i.test(code),
  'has Cairo/Arabic font': /cairo|font-family/i.test(code),
  'has whatsapp/wa.me': /whatsapp|wa\.me|واتساب/i.test(code),
  'has SAR/ريال price': /ريال|sar|ر\.س/i.test(code),
  '200+ lines': code.split('\n').length >= 200,
  'no Lorem Ipsum': !/lorem ipsum/i.test(code),
  'no [INSERT] placeholder': !/\[insert|\[placeholder|lorem/i.test(code),
};
console.log('\n── Quality checks ──');
for (const [k, v] of Object.entries(checks)) console.log(`  ${v ? '✅' : '❌'} ${k}`);

const outFile = path.join(__dirname, 'verify-output.html');
fs.writeFileSync(outFile, code);
console.log(`\n💾 HTML written to ${outFile}`);

console.log('\n── Token usage & cost ──');
let totalCost = 0, totalTok = 0;
for (const [m, action, u] of log) {
  const c = cost(m, u.tokensIn, u.tokensOut); totalCost += c; totalTok += u.tokensIn + u.tokensOut;
  console.log(`  ${action.padEnd(16)} ${m.padEnd(20)} in=${u.tokensIn} out=${u.tokensOut}  $${c.toFixed(4)}`);
}
console.log(`  ${''.padEnd(16)} ${''.padEnd(20)} total tokens=${totalTok}  TOTAL $${totalCost.toFixed(4)}`);
console.log(`\n⏱  ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
