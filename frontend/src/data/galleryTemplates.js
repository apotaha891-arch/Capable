// Curated gallery of demo projects, classified by field.
// Used by Explore and the landing-page showcase so the gallery always looks
// complete. Real community projects from /api/projects/explore are merged on top.

const img = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=640&q=70`;

// Classified fields (categories). Order here = display order.
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
];

export function categoryLabel(id, lang) {
  const c = CATEGORIES.find(c => c.id === id);
  return c ? (lang === 'ar' ? c.ar : c.en) : id;
}

// id values are namespaced strings so they never collide with numeric DB ids.
export const GALLERY_TEMPLATES = [
  // ── Food ──────────────────────────────────────────────────────────────────
  {
    id: 'tpl-food-1', category: 'food', price: 0, likes: 312, views: 4820,
    name_en: 'Saffron Table', name_ar: 'مائدة الزعفران',
    desc_en: 'Elegant fine-dining site with menu, reservations and gallery.',
    desc_ar: 'موقع مطعم راقٍ مع قائمة طعام وحجوزات ومعرض صور.',
    author: 'Lina Haddad', image: img('photo-1517248135467-4c7edcad34c4'),
  },
  {
    id: 'tpl-food-2', category: 'food', price: 19, likes: 198, views: 3110,
    name_en: 'Burger Lab', name_ar: 'مختبر البرجر',
    desc_en: 'Bold fast-food landing with online ordering and combos.',
    desc_ar: 'صفحة وجبات سريعة جريئة مع طلب أونلاين ووجبات مجمعة.',
    author: 'Omar Khalil', image: img('photo-1504674900247-0877df9cc836'),
  },
  // ── E-commerce ──────────────────────────────────────────────────────────────
  {
    id: 'tpl-shop-1', category: 'ecommerce', price: 0, likes: 421, views: 6230,
    name_en: 'Lumière Boutique', name_ar: 'بوتيك لومير',
    desc_en: 'Minimal fashion storefront with product grid and cart.',
    desc_ar: 'متجر أزياء أنيق بشبكة منتجات وسلة شراء.',
    author: 'Sara Nasser', image: img('photo-1441986300917-64674bd600d8'),
  },
  {
    id: 'tpl-shop-2', category: 'ecommerce', price: 29, likes: 276, views: 3980,
    name_en: 'Sole Society', name_ar: 'عالم الأحذية',
    desc_en: 'Sneaker drop store with hero, collections and reviews.',
    desc_ar: 'متجر أحذية رياضية مع واجهة ومجموعات وتقييمات.',
    author: 'James Carter', image: img('photo-1460353581641-37baddab0fa2'),
  },
  // ── SaaS ──────────────────────────────────────────────────────────────────
  {
    id: 'tpl-saas-1', category: 'saas', price: 0, likes: 534, views: 8120,
    name_en: 'FlowMetrics', name_ar: 'فلو ميتركس',
    desc_en: 'Analytics SaaS landing with pricing, features and CTA.',
    desc_ar: 'صفحة منتج تحليلات مع الأسعار والمميزات ودعوة للتسجيل.',
    author: 'Yuki Tanaka', image: img('photo-1551288049-bebda4e38f71'),
  },
  {
    id: 'tpl-saas-2', category: 'saas', price: 0, likes: 389, views: 5640,
    name_en: 'Nimbus AI', name_ar: 'نيمبوس للذكاء',
    desc_en: 'Startup launch page for an AI product with waitlist.',
    desc_ar: 'صفحة إطلاق لشركة ذكاء اصطناعي مع قائمة انتظار.',
    author: 'Mona Saleh', image: img('photo-1522071820081-009f0129c71c'),
  },
  // ── Portfolio ───────────────────────────────────────────────────────────────
  {
    id: 'tpl-port-1', category: 'portfolio', price: 0, likes: 267, views: 3450,
    name_en: 'Studio Noir', name_ar: 'استوديو نوار',
    desc_en: 'Designer portfolio with case studies and contact form.',
    desc_ar: 'بورتفوليو لمصمم مع دراسات حالة ونموذج تواصل.',
    author: 'Elena Rossi', image: img('photo-1499951360447-b19be8fe80f5'),
  },
  {
    id: 'tpl-port-2', category: 'portfolio', price: 15, likes: 154, views: 2210,
    name_en: 'Frame & Light', name_ar: 'إطار وضوء',
    desc_en: 'Photographer gallery with full-bleed image showcase.',
    desc_ar: 'معرض مصوّر فوتوغرافي بعرض صور بملء الشاشة.',
    author: 'Karim Adel', image: img('photo-1542038784456-1ea8e935640e'),
  },
  // ── Education ───────────────────────────────────────────────────────────────
  {
    id: 'tpl-edu-1', category: 'education', price: 0, likes: 301, views: 4710,
    name_en: 'SkillForge Academy', name_ar: 'أكاديمية سكيل فورج',
    desc_en: 'Online course platform with curriculum and enrollment.',
    desc_ar: 'منصة دورات أونلاين مع المنهج والتسجيل.',
    author: 'Aisha Rahman', image: img('photo-1513258496099-48168024aec0'),
  },
  {
    id: 'tpl-edu-2', category: 'education', price: 0, likes: 188, views: 2890,
    name_en: 'BookNest', name_ar: 'عش الكتب',
    desc_en: 'Reading club & library site with featured titles.',
    desc_ar: 'موقع نادي قراءة ومكتبة مع كتب مميزة.',
    author: 'Tom Becker', image: img('photo-1481627834876-b7833e8f5570'),
  },
  // ── Real estate ───────────────────────────────────────────────────────────────
  {
    id: 'tpl-re-1', category: 'realestate', price: 39, likes: 244, views: 3760,
    name_en: 'Vista Realty', name_ar: 'فيستا العقارية',
    desc_en: 'Property listings with search, map and agent profiles.',
    desc_ar: 'قوائم عقارات مع بحث وخريطة وملفات وسطاء.',
    author: 'Hana Yousef', image: img('photo-1560518883-ce09059eeffa'),
  },
  {
    id: 'tpl-re-2', category: 'realestate', price: 0, likes: 176, views: 2530,
    name_en: 'Modern Homes', name_ar: 'منازل عصرية',
    desc_en: 'Single-listing landing for a luxury home with tour.',
    desc_ar: 'صفحة عرض لمنزل فاخر مع جولة افتراضية.',
    author: 'David Müller', image: img('photo-1512917774080-9991f1c4c750'),
  },
  // ── Health ──────────────────────────────────────────────────────────────────
  {
    id: 'tpl-health-1', category: 'health', price: 0, likes: 209, views: 3320,
    name_en: 'CareWell Clinic', name_ar: 'عيادة كيرويل',
    desc_en: 'Medical clinic site with services and appointment booking.',
    desc_ar: 'موقع عيادة طبية مع الخدمات وحجز المواعيد.',
    author: 'Nour Fares', image: img('photo-1576091160550-2173dba999ef'),
  },
  {
    id: 'tpl-health-2', category: 'health', price: 19, likes: 142, views: 1980,
    name_en: 'BrightSmile Dental', name_ar: 'عيادة الابتسامة',
    desc_en: 'Dental practice landing with treatments and reviews.',
    desc_ar: 'صفحة عيادة أسنان مع العلاجات والتقييمات.',
    author: 'Sophia Lee', image: img('photo-1629909613654-28e377c37b09'),
  },
  // ── Fitness ───────────────────────────────────────────────────────────────────
  {
    id: 'tpl-fit-1', category: 'fitness', price: 0, likes: 358, views: 5210,
    name_en: 'IronPulse Gym', name_ar: 'نادي آيرون بالس',
    desc_en: 'Gym site with class schedule, trainers and membership.',
    desc_ar: 'موقع نادي رياضي مع جدول الحصص والمدربين والاشتراكات.',
    author: 'Marco Silva', image: img('photo-1534438327276-14e5300c3a48'),
  },
  {
    id: 'tpl-fit-2', category: 'fitness', price: 0, likes: 197, views: 2740,
    name_en: 'Zen Flow Yoga', name_ar: 'زن فلو لليوغا',
    desc_en: 'Calm yoga studio site with sessions and booking.',
    desc_ar: 'موقع استوديو يوغا هادئ مع الجلسات والحجز.',
    author: 'Maya Kapoor', image: img('photo-1545205597-3d9d02c29597'),
  },
  // ── Events ──────────────────────────────────────────────────────────────────
  {
    id: 'tpl-event-1', category: 'events', price: 25, likes: 286, views: 4090,
    name_en: 'Everlasting Weddings', name_ar: 'أعراس الأبد',
    desc_en: 'Wedding planner site with packages and RSVP form.',
    desc_ar: 'موقع تنظيم أعراس مع الباقات ونموذج تأكيد الحضور.',
    author: 'Layla Mansour', image: img('photo-1519225421980-715cb0215aed'),
  },
  {
    id: 'tpl-event-2', category: 'events', price: 0, likes: 163, views: 2360,
    name_en: 'Pulse Events', name_ar: 'بالس للفعاليات',
    desc_en: 'Conference & concert landing with tickets and agenda.',
    desc_ar: 'صفحة مؤتمرات وحفلات مع التذاكر والجدول.',
    author: 'Chris Walker', image: img('photo-1492684223066-81342ee5ff30'),
  },
  // ── Travel ──────────────────────────────────────────────────────────────────
  {
    id: 'tpl-travel-1', category: 'travel', price: 0, likes: 374, views: 5530,
    name_en: 'Wanderlust Tours', name_ar: 'جولات واندرلَست',
    desc_en: 'Travel agency site with destinations and trip packages.',
    desc_ar: 'موقع وكالة سفر مع الوجهات وباقات الرحلات.',
    author: 'Ines Dubois', image: img('photo-1469854523086-cc02fe5d8800'),
  },
  {
    id: 'tpl-travel-2', category: 'travel', price: 35, likes: 221, views: 3180,
    name_en: 'Azure Resort', name_ar: 'منتجع أزور',
    desc_en: 'Luxury resort landing with rooms, amenities and booking.',
    desc_ar: 'صفحة منتجع فاخر مع الغرف والخدمات والحجز.',
    author: 'Ahmed Saeed', image: img('photo-1566073771259-6a8506099945'),
  },
];
