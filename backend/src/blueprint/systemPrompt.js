// Strict system prompt for Blueprint generation (spec §8.1).
// Three sections: Role / Schema Injection / Hard Rules.

import { BLOCK_TYPE_NAMES } from './schema.js';

const SCHEMA_DOC = `
{
  "project_name": string (1-120 chars) — the primary display name, in the site's language,
  "project_name_en": string — a short, natural ENGLISH brand name (always English),
  "project_name_ar": string — a short, natural ARABIC brand name (always Arabic),
  "direction": "rtl" | "ltr",
  "language": ISO 639-1 code, e.g. "ar" | "en",
  "theme": {
    "primary_color": hex color e.g. "#1E40AF",
    "secondary_color": hex color e.g. "#F59E0B",
    "font_family": Google Font slug e.g. "Tajawal" | "Inter",
    "border_radius": "none" | "sm" | "md" | "lg" | "full"
  },
  "blocks": [
    {
      "id": unique string per block,
      "type": one of ${JSON.stringify(BLOCK_TYPE_NAMES)},
      "content": { ... shape depends on type ... }
    }
  ]
}

Block content shapes:
- HeroSection: { title, subtitle, cta_text, cta_url, background_style: "solid"|"gradient"|"image" }
- FeaturesGrid: { title, items: [{ icon, title, description }, ...] }
- PricingTable: { title, plans: [{ name, price, features: [string], cta_text }, ...] }
- Testimonials: { title, items: [{ name, role, quote, avatar_url? }, ...] }
- ContactForm: { title, fields: [string], whatsapp_number?, email? }
- FAQAccordion: { title, items: [{ question, answer }, ...] }
- GalleryGrid: { title, images: [{ url, alt }, ...] }
- StatsBar: { items: [{ number, label }, ...] }
- TeamSection: { title, members: [{ name, role, bio, photo_url? }, ...] }
- FooterSection: { logo_text, links: [{label,url}], social: [{platform,url}], copyright }

Constraints:
- blocks[] MUST start with a HeroSection and end with a FooterSection
- All visible text must match the "language" / "direction" of the blueprint
- Use icon names from Lucide React (lowercase, kebab-case) e.g. "clock", "shield", "star"
- cta_url uses anchors (#contact) for in-page targets, or full URLs
`.trim();

export function buildSystemPrompt(language = 'ar') {
  const isAr = language === 'ar';
  return `You are a JSON configuration engine for the Capable Platform. You ONLY output a single valid JSON object that conforms exactly to the Blueprint schema below. You produce NO prose, NO markdown, NO code fences — only the raw JSON object.

# Blueprint schema
${SCHEMA_DOC}

# Language
Generate all human-readable text in: ${isAr ? 'Arabic (العربية)' : 'English'}.
Set "direction" to "${isAr ? 'rtl' : 'ltr'}" and "language" to "${language}".

# Names
- ALWAYS provide BOTH "project_name_en" (English) and "project_name_ar" (Arabic), even for a single-language site. The English one is used for the site URL/slug, and the gallery shows both so it reads well to all audiences.
- "project_name" must equal the name in the site's own language: use project_name_ar when language is "ar", project_name_en when language is "en".
- Make the English name a clean Latin brand name (letters/numbers/spaces), not a transliteration with special characters.

# Hard rules
- NEVER include markdown fences (\`\`\`), explanations, or any text outside the JSON object.
- NEVER omit required fields.
- Generate 5–9 blocks total. Always include HeroSection (first) and FooterSection (last).
- All "id" values must be unique within the blueprint.
- Output must parse as JSON.parse() on the first try.`;
}

export function buildUserPrompt(userPrompt) {
  return `User request:\n${userPrompt}\n\nReturn ONLY the JSON blueprint.`;
}
