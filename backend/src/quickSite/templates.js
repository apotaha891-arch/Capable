// Deterministic Blueprint templates for the instant-site funnel (see tiers.js).
// No AI call — the customer's paid-for site must never fail to generate, so
// every tier is a hand-written, schema-valid Blueprint with the site name and
// WhatsApp number merged in.

const img = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;

// Visual style presets picked in the wizard's "style" step. Shared across all
// tiers so the choice is predictable regardless of site type.
const STYLE_PRESETS = {
  calm:    { primary: '#1F4788', secondary: '#6B7280', radius: 'md' },
  warm:    { primary: '#4A7BC8', secondary: '#F59E0B', radius: 'full' },
  bold:    { primary: '#1F2937', secondary: '#1F4788', radius: 'none' },
  premium: { primary: '#1F4788', secondary: '#2E5FA3', radius: 'lg' },
};
const DEFAULT_STYLE = 'calm';
export const QUICK_SITE_STYLE_KEYS = Object.keys(STYLE_PRESETS);

function resolveStyle(styleKey) {
  return STYLE_PRESETS[styleKey] || STYLE_PRESETS[DEFAULT_STYLE];
}

function theme(style) {
  return { primary_color: style.primary, secondary_color: style.secondary, font_family: 'Tajawal', border_radius: style.radius };
}

// Weaves the wizard's contextual detail chip (e.g. "cuisine: Italian", "10-50
// products") into the hero subtitle so the generated site visibly reflects it.
function withDetail(subtitle, detail) {
  return detail ? `${detail} — ${subtitle}` : subtitle;
}

function contactBlock({ isRtl, siteName, whatsapp, titleAr, titleEn, fields }) {
  return {
    id: 'contact',
    type: 'ContactForm',
    content: {
      title: isRtl ? titleAr : titleEn,
      fields,
      whatsapp_number: whatsapp,
    },
  };
}

function footerBlock({ isRtl, siteName }) {
  return {
    id: 'footer',
    type: 'FooterSection',
    content: {
      logo_text: siteName,
      links: [],
      social: [],
      copyright: `© ${new Date().getFullYear()} ${siteName}`,
    },
  };
}

const BUILDERS = {
  simple({ siteName, whatsapp, isRtl, style, detail }) {
    return {
      theme: theme(style),
      blocks: [
        {
          id: 'hero', type: 'HeroSection',
          content: {
            title: siteName,
            subtitle: withDetail(isRtl ? 'موقعك الجديد جاهز — تواصل معنا اليوم' : 'Your new site — get in touch today', detail),
            cta_text: isRtl ? 'تواصل معنا' : 'Contact us',
            cta_url: '#contact',
            background_style: 'gradient',
          },
        },
        {
          id: 'features', type: 'FeaturesGrid',
          content: {
            title: isRtl ? 'لماذا نحن؟' : 'Why choose us',
            items: [
              { icon: '⭐', title: isRtl ? 'جودة عالية' : 'High quality', description: isRtl ? 'نهتم بكل تفصيلة في عملنا.' : 'We care about every detail.' },
              { icon: '⚡', title: isRtl ? 'استجابة سريعة' : 'Fast response', description: isRtl ? 'نرد عليك في أسرع وقت ممكن.' : 'We reply as fast as possible.' },
              { icon: '🤝', title: isRtl ? 'ثقة عملائنا' : 'Trusted by customers', description: isRtl ? 'رضا عملائنا أولويتنا.' : 'Customer satisfaction is our priority.' },
            ],
          },
        },
        contactBlock({
          isRtl, siteName, whatsapp,
          titleAr: 'تواصل معنا', titleEn: 'Get in touch',
          fields: isRtl ? ['الاسم', 'رقم الجوال', 'الرسالة'] : ['Name', 'Phone', 'Message'],
        }),
        footerBlock({ isRtl, siteName }),
      ],
    };
  },

  store({ siteName, whatsapp, isRtl, style, detail }) {
    return {
      theme: theme(style),
      blocks: [
        {
          id: 'hero', type: 'HeroSection',
          content: {
            title: siteName,
            subtitle: withDetail(isRtl ? 'تسوّق أحدث منتجاتنا بأفضل الأسعار' : 'Shop our latest products at the best prices', detail),
            cta_text: isRtl ? 'تسوّق الآن' : 'Shop now',
            cta_url: '#gallery',
            background_style: 'gradient',
          },
        },
        {
          id: 'features', type: 'FeaturesGrid',
          content: {
            title: isRtl ? 'لماذا تتسوّق معنا؟' : 'Why shop with us',
            items: [
              { icon: '🛍️', title: isRtl ? 'منتجات مختارة' : 'Curated products', description: isRtl ? 'نختار كل قطعة بعناية.' : 'Every item is hand-picked.' },
              { icon: '🚚', title: isRtl ? 'توصيل سريع' : 'Fast delivery', description: isRtl ? 'يصلك طلبك في أسرع وقت.' : 'Your order arrives quickly.' },
              { icon: '🔒', title: isRtl ? 'دفع آمن' : 'Secure ordering', description: isRtl ? 'اطلب بثقة وأمان.' : 'Order with confidence.' },
            ],
          },
        },
        {
          id: 'gallery', type: 'GalleryGrid',
          content: {
            title: isRtl ? 'منتجاتنا' : 'Our products',
            images: [
              { url: img('photo-1441986300917-64674bd600d8'), alt: isRtl ? 'منتج مميز' : 'Featured product' },
              { url: img('photo-1523275335684-37898b6baf30'), alt: isRtl ? 'منتج مميز' : 'Featured product' },
              { url: img('photo-1560343090-f0409e92791a'), alt: isRtl ? 'منتج مميز' : 'Featured product' },
            ],
          },
        },
        {
          id: 'pricing', type: 'PricingTable',
          content: {
            title: isRtl ? 'باقاتنا' : 'Our packages',
            plans: [
              { name: isRtl ? 'أساسي' : 'Basic', price: isRtl ? 'حسب الطلب' : 'On request', features: [isRtl ? 'منتج واحد' : 'One item', isRtl ? 'توصيل قياسي' : 'Standard delivery'], cta_text: isRtl ? 'اطلب الآن' : 'Order now' },
              { name: isRtl ? 'مميز' : 'Premium', price: isRtl ? 'حسب الطلب' : 'On request', features: [isRtl ? 'عدة منتجات' : 'Multiple items', isRtl ? 'توصيل سريع' : 'Priority delivery'], cta_text: isRtl ? 'اطلب الآن' : 'Order now' },
            ],
          },
        },
        contactBlock({
          isRtl, siteName, whatsapp,
          titleAr: 'اطلب عبر واتساب', titleEn: 'Order via WhatsApp',
          fields: isRtl ? ['الاسم', 'المنتج المطلوب', 'العنوان'] : ['Name', 'Item', 'Address'],
        }),
        footerBlock({ isRtl, siteName }),
      ],
    };
  },

  booking({ siteName, whatsapp, isRtl, style, detail }) {
    return {
      theme: theme(style),
      blocks: [
        {
          id: 'hero', type: 'HeroSection',
          content: {
            title: siteName,
            subtitle: withDetail(isRtl ? 'احجز مكانك أو موعدك بسهولة' : 'Book your table or appointment easily', detail),
            cta_text: isRtl ? 'احجز الآن' : 'Book now',
            cta_url: '#contact',
            background_style: 'gradient',
          },
        },
        {
          id: 'features', type: 'FeaturesGrid',
          content: {
            title: isRtl ? 'لماذا نحن؟' : 'Why choose us',
            items: [
              { icon: '🍽️', title: isRtl ? 'جودة عالية' : 'High quality', description: isRtl ? 'نقدّم الأفضل دائماً.' : 'We always deliver the best.' },
              { icon: '📅', title: isRtl ? 'حجز سهل' : 'Easy booking', description: isRtl ? 'احجز في دقائق عبر واتساب.' : 'Book in minutes via WhatsApp.' },
              { icon: '⭐', title: isRtl ? 'تقييمات ممتازة' : 'Great reviews', description: isRtl ? 'عملاؤنا يثقون بنا.' : 'Our customers trust us.' },
            ],
          },
        },
        {
          id: 'stats', type: 'StatsBar',
          content: {
            items: [
              { number: '+500', label: isRtl ? 'عميل سعيد' : 'Happy customers' },
              { number: '4.9★', label: isRtl ? 'تقييم' : 'Rating' },
              { number: '24/7', label: isRtl ? 'دعم' : 'Support' },
            ],
          },
        },
        contactBlock({
          isRtl, siteName, whatsapp,
          titleAr: 'احجز موعدك', titleEn: 'Book your spot',
          fields: isRtl ? ['الاسم', 'عدد الأشخاص / نوع الخدمة', 'الوقت المفضّل'] : ['Name', 'Party size / service', 'Preferred time'],
        }),
        footerBlock({ isRtl, siteName }),
      ],
    };
  },

  marketplace({ siteName, whatsapp, isRtl, style, detail }) {
    return {
      theme: theme(style),
      blocks: [
        {
          id: 'hero', type: 'HeroSection',
          content: {
            title: siteName,
            subtitle: withDetail(isRtl ? 'كل ما تحتاجه في مكان واحد' : 'Everything you need in one place', detail),
            cta_text: isRtl ? 'استعرض العروض' : 'Browse offerings',
            cta_url: '#pricing',
            background_style: 'gradient',
          },
        },
        {
          id: 'features', type: 'FeaturesGrid',
          content: {
            title: isRtl ? 'لماذا هذا السوق؟' : 'Why this marketplace',
            items: [
              { icon: '🏪', title: isRtl ? 'بائعون متعددون' : 'Multiple sellers', description: isRtl ? 'تشكيلة واسعة من العروض.' : 'A wide range of offerings.' },
              { icon: '💳', title: isRtl ? 'دفع آمن' : 'Secure payments', description: isRtl ? 'معاملات موثوقة وآمنة.' : 'Trusted, secure transactions.' },
              { icon: '📦', title: isRtl ? 'تسليم موثوق' : 'Reliable delivery', description: isRtl ? 'نضمن وصول طلبك.' : 'We ensure your order arrives.' },
            ],
          },
        },
        {
          id: 'pricing', type: 'PricingTable',
          content: {
            title: isRtl ? 'خطط البائعين' : 'Seller plans',
            plans: [
              { name: isRtl ? 'بائع مبتدئ' : 'Starter seller', price: isRtl ? 'حسب الاتفاق' : 'By arrangement', features: [isRtl ? 'حتى 10 منتجات' : 'Up to 10 listings', isRtl ? 'دعم أساسي' : 'Basic support'], cta_text: isRtl ? 'انضم الآن' : 'Join now' },
              { name: isRtl ? 'بائع محترف' : 'Pro seller', price: isRtl ? 'حسب الاتفاق' : 'By arrangement', features: [isRtl ? 'منتجات غير محدودة' : 'Unlimited listings', isRtl ? 'دعم مميز' : 'Priority support'], cta_text: isRtl ? 'انضم الآن' : 'Join now' },
            ],
          },
        },
        {
          id: 'testimonials', type: 'Testimonials',
          content: {
            title: isRtl ? 'آراء عملائنا' : 'What people say',
            items: [
              { name: isRtl ? 'عميل سعيد' : 'Happy customer', role: isRtl ? 'مشترٍ' : 'Buyer', quote: isRtl ? 'تجربة تسوّق ممتازة وسهلة.' : 'A great, easy shopping experience.' },
            ],
          },
        },
        {
          id: 'stats', type: 'StatsBar',
          content: {
            items: [
              { number: '+100', label: isRtl ? 'بائع' : 'Sellers' },
              { number: '+1000', label: isRtl ? 'منتج' : 'Listings' },
              { number: '4.8★', label: isRtl ? 'تقييم' : 'Rating' },
            ],
          },
        },
        contactBlock({
          isRtl, siteName, whatsapp,
          titleAr: 'انضم كبائع أو تواصل معنا', titleEn: 'Join as a seller or get in touch',
          fields: isRtl ? ['الاسم', 'نوع النشاط', 'رقم الجوال'] : ['Name', 'Business type', 'Phone'],
        }),
        footerBlock({ isRtl, siteName }),
      ],
    };
  },
};

// Builds a full, schema-shaped Blueprint for the given tier. Caller (server.js)
// is responsible for validating the result with BlueprintSchema.safeParse
// before persisting it.
export function buildBlueprintForTier(tierKey, { siteName, whatsapp, language = 'ar', styleKey, detail }) {
  const builder = BUILDERS[tierKey];
  if (!builder) throw new Error(`Unknown quick-site tier: ${tierKey}`);
  const isRtl = language === 'ar';
  const style = resolveStyle(styleKey);
  const cleanDetail = detail ? String(detail).slice(0, 60) : undefined;
  const { theme: themeOut, blocks } = builder({ siteName, whatsapp, isRtl, style, detail: cleanDetail });
  return {
    project_name: siteName,
    project_name_en: isRtl ? siteName : siteName,
    project_name_ar: isRtl ? siteName : siteName,
    direction: isRtl ? 'rtl' : 'ltr',
    language,
    theme: themeOut,
    blocks,
  };
}

// Applied on top of an AI-generated blueprint (or the deterministic fallback)
// so the promises made earlier in the wizard — the exact style picked, the
// real WhatsApp number, the exact site name typed — always hold regardless of
// what the model produced. Mutates and returns the same blueprint object.
export function applyQuickSiteOverrides(blueprint, { siteName, whatsapp, styleKey }) {
  const style = resolveStyle(styleKey);
  blueprint.theme = {
    primary_color: style.primary,
    secondary_color: style.secondary,
    font_family: blueprint.theme?.font_family || 'Tajawal',
    border_radius: style.radius,
  };
  blueprint.project_name = siteName;
  blueprint.project_name_en = blueprint.project_name_en || siteName;
  blueprint.project_name_ar = blueprint.project_name_ar || siteName;

  const contact = blueprint.blocks.find(b => b.type === 'ContactForm');
  if (contact) {
    contact.content.whatsapp_number = whatsapp;
  } else {
    const isRtl = blueprint.direction === 'rtl';
    const footerIdx = blueprint.blocks.findIndex(b => b.type === 'FooterSection');
    const insertAt = footerIdx === -1 ? blueprint.blocks.length : footerIdx;
    blueprint.blocks.splice(insertAt, 0, {
      id: 'contact_override',
      type: 'ContactForm',
      content: {
        title: isRtl ? 'تواصل معنا' : 'Get in touch',
        fields: isRtl ? ['الاسم', 'رقم الجوال', 'الرسالة'] : ['Name', 'Phone', 'Message'],
        whatsapp_number: whatsapp,
      },
    });
  }
  return blueprint;
}
