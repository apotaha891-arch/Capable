// Minimal valid default content when adding a new block in the editor.
let counter = 0;
export function newBlockId(type) {
  counter += 1;
  return `${type.toLowerCase()}_${Date.now().toString(36)}${counter}`;
}

export const BLOCK_DEFAULTS = {
  HeroSection: { title: 'Headline', subtitle: 'Subtitle', cta_text: 'Get started', cta_url: '#contact', background_style: 'gradient' },
  FeaturesGrid: { title: 'Features', items: [{ icon: 'star', title: 'Feature', description: 'Description' }] },
  PricingTable: { title: 'Pricing', plans: [{ name: 'Basic', price: '$0', features: ['Feature 1'], cta_text: 'Choose' }] },
  Testimonials: { title: 'Testimonials', items: [{ name: 'Name', role: 'Role', quote: 'Great!' }] },
  ContactForm: { title: 'Contact us', fields: ['Name', 'Email'], whatsapp_number: '', email: 'hello@example.com' },
  FAQAccordion: { title: 'FAQ', items: [{ question: 'Question?', answer: 'Answer.' }] },
  GalleryGrid: { title: 'Gallery', images: [{ url: 'https://picsum.photos/400', alt: 'Image' }] },
  StatsBar: { items: [{ number: '100+', label: 'Customers' }] },
  TeamSection: { title: 'Our team', members: [{ name: 'Name', role: 'Role', bio: 'Bio' }] },
  FooterSection: { logo_text: 'Brand', links: [{ label: 'Home', url: '#' }], social: [{ platform: 'X', url: '#' }], copyright: `© ${new Date().getFullYear()} Brand` },
};

export const BLOCK_TYPES = Object.keys(BLOCK_DEFAULTS);
