// Builds the free-text prompt fed to the real AI blueprint generator
// (backend/src/blueprint/generate.js) for the instant-site funnel — the
// customer never types a prompt, so we construct one from their wizard
// selections (tier + site name + the contextual detail chip).

const PROMPT_TEMPLATES = {
  simple: {
    ar: ({ siteName, detail }) => `أنشئ موقعًا إلكترونيًا احترافيًا لعمل تجاري باسم "${siteName}". الهدف الأساسي من الموقع: ${detail || 'التعريف بالعمل وخدماته'}. اجعل المحتوى مقنعًا وواقعيًا يناسب هذا النوع من الأعمال.`,
    en: ({ siteName, detail }) => `Create a professional business website named "${siteName}". The site's main goal: ${detail || 'introducing the business and its services'}. Make the content convincing and realistic for this kind of business.`,
  },
  store: {
    ar: ({ siteName, detail }) => `أنشئ متجرًا إلكترونيًا باسم "${siteName}" يعرض منتجات حقيقية ومقنعة (${detail || 'تشكيلة متوسطة من المنتجات'}). اجعل المحتوى والمنتجات واقعية ومناسبة لمتجر إلكتروني احترافي.`,
    en: ({ siteName, detail }) => `Create an online store named "${siteName}" showcasing realistic, convincing products (${detail || 'a moderate product catalog'}). Make the content and products feel like a real, professional e-commerce store.`,
  },
  booking: {
    ar: ({ siteName, detail }) => `أنشئ موقعًا لنشاط "${detail || 'حجوزات وخدمات'}" باسم "${siteName}" يتضمن قائمة بالخدمات أو الأطباق ونموذج حجز مواعيد أو طاولات. اجعل المحتوى واقعيًا واحترافيًا.`,
    en: ({ siteName, detail }) => `Create a website for a "${detail || 'bookings and services'}" business named "${siteName}", including a menu/services list and a booking/reservation form. Make the content realistic and professional.`,
  },
  marketplace: {
    ar: ({ siteName, detail }) => `أنشئ سوقًا إلكترونيًا متعدد البائعين باسم "${siteName}" (${detail || 'عدة بائعين وفئات متنوعة'}). اجعل المحتوى يعكس منصة سوق حقيقية بعروض وفئات متنوعة وخطط للبائعين.`,
    en: ({ siteName, detail }) => `Create a multi-vendor marketplace website named "${siteName}" (${detail || 'several sellers across varied categories'}). Make the content reflect a real marketplace platform with varied offerings/categories and seller plans.`,
  },
};

export function buildQuickSitePrompt(tierKey, { siteName, detail, language = 'ar' }) {
  const template = PROMPT_TEMPLATES[tierKey];
  if (!template) throw new Error(`Unknown quick-site tier: ${tierKey}`);
  const lang = language === 'ar' ? 'ar' : 'en';
  return template[lang]({ siteName, detail });
}
