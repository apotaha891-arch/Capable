// Produces the final, schema-valid Blueprint for a paid instant-site checkout.
// Primary path: real AI generation (the same engine/pipeline as the main
// prompt-based builder), so the delivered site has genuine, unique content —
// not a static template. Because this is a PAID flow, reliability still comes
// first: if AI generation fails after its internal retries, we fall back to
// the deterministic per-tier template (templates.js) so the customer never
// ends up with no site at all.
import { generateBlueprint, GenerationError } from '../blueprint/generate.js';
import { BlueprintSchema } from '../blueprint/schema.js';
import { buildQuickSitePrompt } from './prompt.js';
import { buildBlueprintForTier, applyQuickSiteOverrides } from './templates.js';

export async function finalizeQuickSiteBlueprint({ tierKey, siteName, whatsapp, language, styleKey, detail }) {
  let blueprint;
  let usedAI = true;
  let usage = null;

  try {
    const prompt = buildQuickSitePrompt(tierKey, { siteName, detail, language });
    const out = await generateBlueprint({ prompt, language });
    blueprint = out.blueprint;
    usage = out.usage;
  } catch (err) {
    usedAI = false;
    if (!(err instanceof GenerationError)) console.error('quick-site AI generation error:', err.message);
    blueprint = buildBlueprintForTier(tierKey, { siteName, whatsapp, language, styleKey, detail });
  }

  blueprint = applyQuickSiteOverrides(blueprint, { siteName, whatsapp, styleKey });

  let parsed = BlueprintSchema.safeParse(blueprint);
  if (!parsed.success) {
    // Overrides only touch already-valid shapes, so this should be unreachable —
    // but if it ever happens, fall all the way back to the deterministic
    // template rather than risk leaving a paying customer with nothing.
    console.error('quick-site blueprint failed validation after overrides:', parsed.error.issues);
    usedAI = false;
    usage = null;
    blueprint = applyQuickSiteOverrides(
      buildBlueprintForTier(tierKey, { siteName, whatsapp, language, styleKey, detail }),
      { siteName, whatsapp, styleKey }
    );
    parsed = BlueprintSchema.safeParse(blueprint);
  }

  return { blueprint: parsed.data, usedAI, usage };
}
