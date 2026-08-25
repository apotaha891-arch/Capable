// Reliability ladder for blueprint generation, mirroring the code-builder
// pipeline's generator escalation (backend/server.js BUILDER_TIERS): the
// default provider generates first; on failure we escalate to the next
// configured provider (Gemini, then Anthropic Sonnet) rather than retrying a
// provider that may simply be unavailable. Within each rung, a couple of
// JSON/schema-fix attempts let the model self-correct before we escalate.

import { BlueprintSchema, getFallbackBlueprint } from './schema.js';
import { buildSystemPrompt, buildUserPrompt } from './systemPrompt.js';
import { callProvider, resolveGeneratorLadder } from '../ai/provider.js';

// Strip ```json fences, BOM, leading/trailing whitespace.
function safeParseJSON(raw) {
  if (typeof raw !== 'string') return null;
  let s = raw.trim();
  if (s.startsWith('﻿')) s = s.slice(1);
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)```$/);
  if (fence) s = fence[1].trim();
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first > 0 && last > first) s = s.slice(first, last + 1);
  try { return JSON.parse(s); } catch { return null; }
}

export class GenerationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'GenerationError';
    this.details = details;
  }
}

export async function generateBlueprint({ prompt, language = 'ar', attemptsPerRung = 2 }) {
  const system = buildSystemPrompt(language);
  const ladder = resolveGeneratorLadder();
  if (ladder.length === 0) throw new Error('No AI provider configured');

  let lastError = null;
  let totalTokensIn = 0;
  let totalTokensOut = 0;
  let modelUsed = null;
  let escalated = false;
  let totalAttempts = 0;

  for (let rung = 0; rung < ladder.length; rung++) {
    if (rung > 0) escalated = true;
    let user = buildUserPrompt(prompt);

    for (let attempt = 1; attempt <= attemptsPerRung; attempt++) {
      totalAttempts++;
      let text, tokens_in, tokens_out, model;
      try {
        ({ text, tokens_in, tokens_out, model } = await callProvider(ladder[rung], { system, user }));
      } catch (err) {
        lastError = err.message;
        break; // this provider itself is failing — stop burning attempts on it, escalate
      }
      totalTokensIn += tokens_in;
      totalTokensOut += tokens_out;
      modelUsed = model;

      const parsedJSON = safeParseJSON(text);
      if (!parsedJSON) {
        lastError = 'Output was not parseable JSON.';
        user = `${buildUserPrompt(prompt)}\n\nPrevious attempt failed: ${lastError} Return ONLY a valid JSON object.`;
        continue;
      }

      const result = BlueprintSchema.safeParse(parsedJSON);
      if (result.success) {
        return {
          blueprint: result.data,
          usage: { tokens_in: totalTokensIn, tokens_out: totalTokensOut, model: modelUsed, attempts: totalAttempts, escalated },
        };
      }

      lastError = result.error.issues
        .slice(0, 8)
        .map(i => `- ${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('\n');
      user = `${buildUserPrompt(prompt)}\n\nPrevious attempt failed validation. Fix these issues and return ONLY the JSON:\n${lastError}`;
    }
    // Rung exhausted (or the provider errored outright) — escalate to the next one.
  }

  throw new GenerationError(
    `Failed to produce a valid blueprint after escalating through ${ladder.length} provider(s)`,
    { lastError, tokens_in: totalTokensIn, tokens_out: totalTokensOut, model: modelUsed }
  );
}

export { getFallbackBlueprint };
