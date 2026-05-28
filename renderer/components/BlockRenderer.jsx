import { HeroSection } from './blocks/HeroSection';
import { FeaturesGrid } from './blocks/FeaturesGrid';
import { PricingTable } from './blocks/PricingTable';
import { Testimonials } from './blocks/Testimonials';
import { ContactForm } from './blocks/ContactForm';
import { FAQAccordion } from './blocks/FAQAccordion';
import { GalleryGrid } from './blocks/GalleryGrid';
import { StatsBar } from './blocks/StatsBar';
import { TeamSection } from './blocks/TeamSection';
import { FooterSection } from './blocks/FooterSection';
import { themeStyle, googleFontHref } from '@/lib/theme';

const BLOCK_MAP = {
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

export function BlockRenderer({ blueprint }) {
  if (!blueprint || !Array.isArray(blueprint.blocks)) return null;
  const fontHref = googleFontHref(blueprint.theme?.font_family);
  return (
    <>
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <div
        dir={blueprint.direction || 'ltr'}
        lang={blueprint.language || 'en'}
        style={themeStyle(blueprint.theme)}
        className="font-site"
      >
        {blueprint.blocks.map(block => {
          const Component = BLOCK_MAP[block.type];
          if (!Component) return null;
          return (
            <Component
              key={block.id}
              content={block.content}
              theme={blueprint.theme}
              direction={blueprint.direction}
            />
          );
        })}
      </div>
    </>
  );
}
