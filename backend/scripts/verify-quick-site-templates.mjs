// Validates every instant-site funnel tier template against BlueprintSchema,
// in both languages, so a future template edit can't silently break the
// no-prompt checkout path (which has no AI retry ladder to fall back on).
//   node scripts/verify-quick-site-templates.mjs
import { QUICK_SITE_TIER_KEYS } from '../src/quickSite/tiers.js';
import { buildBlueprintForTier, QUICK_SITE_STYLE_KEYS } from '../src/quickSite/templates.js';
import { BlueprintSchema } from '../src/blueprint/schema.js';

let failures = 0;

for (const tier of QUICK_SITE_TIER_KEYS) {
  for (const language of ['ar', 'en']) {
    for (const styleKey of QUICK_SITE_STYLE_KEYS) {
      const blueprint = buildBlueprintForTier(tier, {
        siteName: language === 'ar' ? 'موقعي التجريبي' : 'My Test Site',
        whatsapp: '966500000000',
        language,
        styleKey,
        detail: language === 'ar' ? 'تفصيل تجريبي' : 'Test detail',
      });
      const result = BlueprintSchema.safeParse(blueprint);
      if (result.success) {
        console.log(`OK   ${tier} (${language}, ${styleKey})`);
      } else {
        failures++;
        console.error(`FAIL ${tier} (${language}, ${styleKey}):`);
        for (const issue of result.error.issues) {
          console.error(`  - ${issue.path.join('.') || '(root)'}: ${issue.message}`);
        }
      }
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} template(s) failed validation.`);
  process.exit(1);
}
console.log('\nAll instant-site templates are schema-valid.');
