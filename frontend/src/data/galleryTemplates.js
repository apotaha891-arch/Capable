// Gallery field classification (labels only). Projects themselves are real
// records served from /api/projects/explore — no fake catalog entries.

export const CATEGORIES = [
  { id: 'food',       en: 'Restaurants & Food',   ar: 'مطاعم وأطعمة' },
  { id: 'ecommerce',  en: 'Stores & E-commerce',  ar: 'متاجر وتسوق' },
  { id: 'saas',       en: 'SaaS & Startups',      ar: 'شركات ناشئة' },
  { id: 'portfolio',  en: 'Portfolio & Creative', ar: 'أعمال إبداعية' },
  { id: 'education',  en: 'Education & Courses',   ar: 'تعليم ودورات' },
  { id: 'realestate', en: 'Real Estate',          ar: 'عقارات' },
  { id: 'health',     en: 'Health & Clinics',     ar: 'صحة وعيادات' },
  { id: 'fitness',    en: 'Fitness & Gyms',       ar: 'لياقة ورياضة' },
  { id: 'events',     en: 'Events & Weddings',    ar: 'مناسبات وأعراس' },
  { id: 'travel',     en: 'Travel & Tourism',     ar: 'سفر وسياحة' },
  { id: 'tools',      en: 'Tools & Apps',         ar: 'أدوات وتطبيقات' },
  { id: 'other',      en: 'More',                 ar: 'أخرى' },
];

export function categoryLabel(id, lang) {
  const c = CATEGORIES.find(c => c.id === id);
  return c ? (lang === 'ar' ? c.ar : c.en) : id;
}
