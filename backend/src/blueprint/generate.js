// Validation retry loop (spec §8.2). Up to 3 attempts; on each failure the
// Zod error is appended to the prompt so the model can self-correct.

import { BlueprintSchema, getFallbackBlueprint } from './schema.js';
import { buildSystemPrompt, buildUserPrompt } from './systemPrompt.js';
import { generateJSON } from '../ai/provider.js';

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

export async function generateBlueprint({ prompt, language = 'ar', maxRetries = 3 }) {
  const system = buildSystemPrompt(language);
  let user = buildUserPrompt(prompt);

  let lastError = null;
  let totalTokensIn = 0;
  let totalTokensOut = 0;
  let modelUsed = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const { text, tokens_in, tokens_out, model } = await generateJSON({ system, user });
    totalTokensIn += tokens_in;
    totalTokensOut += tokens_out;
    modelUsed = model;

    const parsed = safeParseJSON(text);
    if (!parsed) {
      lastError = 'Output was not parseable JSON.';
      user = `${buildUserPrompt(prompt)}\n\nPrevious attempt failed: ${lastError} Return ONLY a valid JSON object.`;
      continue;
    }

    const result = BlueprintSchema.safeParse(parsed);
    if (result.success) {
      return {
        blueprint: result.data,
        usage: { tokens_in: totalTokensIn, tokens_out: totalTokensOut, model: modelUsed, attempts: attempt },
      };
    }

    lastError = result.error.issues
      .slice(0, 8)
      .map(i => `- ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    user = `${buildUserPrompt(prompt)}\n\nPrevious attempt failed validation. Fix these issues and return ONLY the JSON:\n${lastError}`;
  }

  throw new GenerationError(
    `Failed to produce a valid blueprint after ${maxRetries} attempts`,
    { lastError, tokens_in: totalTokensIn, tokens_out: totalTokensOut, model: modelUsed }
  );
}

export { getFallbackBlueprint };
