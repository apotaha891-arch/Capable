// Instant-Site funnel: fixed-price, no-prompt site creation.
// Each tier maps to a deterministic Blueprint template (see templates.js) —
// no AI call, so this path can never fail the way a free-text generation can.

export const QUICK_SITE_TIERS = {
  simple: {
    key: 'simple',
    priceSar: 50,
    nameEn: 'Simple Website',
    nameAr: 'موقع بسيط',
    descriptionEn: 'A clean one-page site for any business — about, services, contact.',
    descriptionAr: 'صفحة واحدة أنيقة لأي عمل: من نحن، خدماتنا، تواصل معنا.',
    exampleCategory: 'portfolio',
  },
  store: {
    key: 'store',
    priceSar: 75,
    nameEn: 'Online Store',
    nameAr: 'متجر إلكتروني',
    descriptionEn: 'Showcase products with pricing and a way for customers to order.',
    descriptionAr: 'اعرض منتجاتك مع الأسعار وطريقة سهلة لاستقبال الطلبات.',
    exampleCategory: 'ecommerce',
  },
  booking: {
    key: 'booking',
    priceSar: 75,
    nameEn: 'Restaurant / Booking Site',
    nameAr: 'موقع مطعم أو حجوزات',
    descriptionEn: 'Menu or service list plus a reservation/booking form.',
    descriptionAr: 'قائمة طعام أو خدمات مع نموذج حجز مباشر.',
    exampleCategory: 'food',
  },
  marketplace: {
    key: 'marketplace',
    priceSar: 100,
    nameEn: 'Marketplace',
    nameAr: 'سوق إلكتروني',
    descriptionEn: 'Multi-category storefront styled for several sellers or offerings.',
    descriptionAr: 'واجهة متجر متعددة الأقسام تناسب عدة بائعين أو عروض.',
    exampleCategory: 'ecommerce',
  },
};

export const QUICK_SITE_TIER_KEYS = Object.keys(QUICK_SITE_TIERS);

export function getTier(key) {
  return QUICK_SITE_TIERS[key] || null;
}
