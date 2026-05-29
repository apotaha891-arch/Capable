// Friendly bilingual labels for block types and content fields in the editor.

const BLOCK_LABELS = {
  HeroSection: { en: 'Hero', ar: 'القسم الرئيسي' },
  FeaturesGrid: { en: 'Features', ar: 'المميزات' },
  PricingTable: { en: 'Pricing', ar: 'الأسعار' },
  Testimonials: { en: 'Testimonials', ar: 'آراء العملاء' },
  ContactForm: { en: 'Contact form', ar: 'نموذج تواصل' },
  FAQAccordion: { en: 'FAQ', ar: 'الأسئلة الشائعة' },
  GalleryGrid: { en: 'Gallery', ar: 'معرض الصور' },
  StatsBar: { en: 'Stats', ar: 'الإحصائيات' },
  TeamSection: { en: 'Team', ar: 'الفريق' },
  FooterSection: { en: 'Footer', ar: 'التذييل' },
};

const FIELD_LABELS = {
  title: { en: 'Title', ar: 'العنوان' },
  subtitle: { en: 'Subtitle', ar: 'العنوان الفرعي' },
  description: { en: 'Description', ar: 'الوصف' },
  cta_text: { en: 'Button text', ar: 'نص الزر' },
  cta_url: { en: 'Button link', ar: 'رابط الزر' },
  background_style: { en: 'Background', ar: 'الخلفية' },
  items: { en: 'Items', ar: 'العناصر' },
  plans: { en: 'Plans', ar: 'الخطط' },
  members: { en: 'Members', ar: 'الأعضاء' },
  images: { en: 'Images', ar: 'الصور' },
  fields: { en: 'Form fields', ar: 'حقول النموذج' },
  features: { en: 'Features', ar: 'المميزات' },
  links: { en: 'Links', ar: 'الروابط' },
  social: { en: 'Social', ar: 'التواصل الاجتماعي' },
  icon: { en: 'Icon', ar: 'الأيقونة' },
  name: { en: 'Name', ar: 'الاسم' },
  role: { en: 'Role', ar: 'الدور' },
  quote: { en: 'Quote', ar: 'الاقتباس' },
  avatar_url: { en: 'Avatar URL', ar: 'رابط الصورة' },
  photo_url: { en: 'Photo URL', ar: 'رابط الصورة' },
  bio: { en: 'Bio', ar: 'نبذة' },
  question: { en: 'Question', ar: 'السؤال' },
  answer: { en: 'Answer', ar: 'الإجابة' },
  url: { en: 'URL', ar: 'الرابط' },
  alt: { en: 'Alt text', ar: 'نص بديل' },
  label: { en: 'Label', ar: 'التسمية' },
  number: { en: 'Number', ar: 'الرقم' },
  price: { en: 'Price', ar: 'السعر' },
  cta_text_plan: { en: 'Button text', ar: 'نص الزر' },
  platform: { en: 'Platform', ar: 'المنصة' },
  whatsapp_number: { en: 'WhatsApp number', ar: 'رقم واتساب' },
  email: { en: 'Email', ar: 'البريد الإلكتروني' },
  logo_text: { en: 'Logo text', ar: 'نص الشعار' },
  copyright: { en: 'Copyright', ar: 'حقوق النشر' },
};

const humanize = key => String(key || '').replace(/_/g, ' ');

export function blockLabel(type, lang) {
  return BLOCK_LABELS[type]?.[lang === 'ar' ? 'ar' : 'en'] || type;
}

export function fieldLabel(key, lang) {
  return FIELD_LABELS[key]?.[lang === 'ar' ? 'ar' : 'en'] || humanize(key);
}
