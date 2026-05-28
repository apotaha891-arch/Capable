// Capable Blueprint v2.0 — Zod schema (spec §3)
// Single source of truth for AI-generated site configuration.

import { z } from 'zod';

const HexColor = z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, 'Must be a hex color');
const Url = z.string().min(1);

const Theme = z.object({
  primary_color: HexColor,
  secondary_color: HexColor,
  font_family: z.string().min(1),
  border_radius: z.enum(['none', 'sm', 'md', 'lg', 'full']),
});

const HeroSection = z.object({
  title: z.string(),
  subtitle: z.string(),
  cta_text: z.string(),
  cta_url: z.string(),
  background_style: z.enum(['solid', 'gradient', 'image']),
});

const FeaturesGrid = z.object({
  title: z.string(),
  items: z.array(z.object({
    icon: z.string(),
    title: z.string(),
    description: z.string(),
  })).min(1),
});

const PricingTable = z.object({
  title: z.string(),
  plans: z.array(z.object({
    name: z.string(),
    price: z.string(),
    features: z.array(z.string()),
    cta_text: z.string(),
  })).min(1),
});

const Testimonials = z.object({
  title: z.string(),
  items: z.array(z.object({
    name: z.string(),
    role: z.string(),
    quote: z.string(),
    avatar_url: Url.optional(),
  })).min(1),
});

const ContactForm = z.object({
  title: z.string(),
  fields: z.array(z.string()),
  whatsapp_number: z.string().optional(),
  email: z.string().optional(),
});

const FAQAccordion = z.object({
  title: z.string(),
  items: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).min(1),
});

const GalleryGrid = z.object({
  title: z.string(),
  images: z.array(z.object({
    url: Url,
    alt: z.string(),
  })).min(1),
});

const StatsBar = z.object({
  items: z.array(z.object({
    number: z.string(),
    label: z.string(),
  })).min(1),
});

const TeamSection = z.object({
  title: z.string(),
  members: z.array(z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string(),
    photo_url: Url.optional(),
  })).min(1),
});

const FooterSection = z.object({
  logo_text: z.string(),
  links: z.array(z.object({
    label: z.string(),
    url: z.string(),
  })),
  social: z.array(z.object({
    platform: z.string(),
    url: z.string(),
  })),
  copyright: z.string(),
});

const BLOCK_TYPES = {
  HeroSection,
  FeaturesGrid,
  PricingTable,
  Testimonials,
  ContactForm,
  FAQAccordion,
  GalleryGrid,
  StatsBar,
  TeamSection,
  FooterSection,
};

export const BLOCK_TYPE_NAMES = Object.keys(BLOCK_TYPES);

const Block = z.discriminatedUnion('type', BLOCK_TYPE_NAMES.map(type =>
  z.object({
    id: z.string().min(1),
    type: z.literal(type),
    content: BLOCK_TYPES[type],
  })
));

export const BlueprintSchema = z.object({
  project_name: z.string().min(1).max(120),
  // Cross-language display names. Optional for backward-compatibility with
  // blueprints generated before this field existed; new generations always set both.
  project_name_en: z.string().min(1).max(120).optional(),
  project_name_ar: z.string().min(1).max(120).optional(),
  direction: z.enum(['rtl', 'ltr']),
  language: z.string().min(2).max(5),
  theme: Theme,
  blocks: z.array(Block).min(1),
}).refine(
  bp => bp.blocks.some(b => b.type === 'HeroSection'),
  { message: 'Blueprint must include a HeroSection block', path: ['blocks'] }
).refine(
  bp => bp.blocks.some(b => b.type === 'FooterSection'),
  { message: 'Blueprint must include a FooterSection block', path: ['blocks'] }
);

// Minimal safe fallback when AI fails after retries (spec §8.2)
export function getFallbackBlueprint(projectName, language = 'ar') {
  const isRtl = language === 'ar';
  return {
    project_name: projectName,
    project_name_en: isRtl ? 'My Site' : projectName,
    project_name_ar: isRtl ? projectName : 'موقعي',
    direction: isRtl ? 'rtl' : 'ltr',
    language,
    theme: {
      primary_color: '#1E40AF',
      secondary_color: '#F59E0B',
      font_family: isRtl ? 'Tajawal' : 'Inter',
      border_radius: 'md',
    },
    blocks: [
      {
        id: 'hero_fallback',
        type: 'HeroSection',
        content: {
          title: projectName,
          subtitle: isRtl ? 'موقعك الجديد جاهز للتخصيص' : 'Your new site, ready to customize',
          cta_text: isRtl ? 'تواصل معنا' : 'Get in touch',
          cta_url: '#contact',
          background_style: 'gradient',
        },
      },
      {
        id: 'footer_fallback',
        type: 'FooterSection',
        content: {
          logo_text: projectName,
          links: [],
          social: [],
          copyright: `© ${new Date().getFullYear()} ${projectName}`,
        },
      },
    ],
  };
}
