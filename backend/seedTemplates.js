import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const SYSTEM_EMAIL = 'admin@capable.test';
const SYSTEM_NAME = 'Capable Team';
const img = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;
const thumb = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=640&q=70`;

// One polished, complete, RTL Arabic landing page with a working lead form.
// The published-site lead-capture script (injected on publish) turns the form
// into real leads in the owner control panel.
function buildPage(c) {
  const cards = c.cards.map(card => `
        <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div class="w-11 h-11 rounded-xl mb-4 flex items-center justify-center text-2xl" style="background:${c.accent}1a;color:${c.accent}">${card.icon}</div>
          <h3 class="text-lg font-bold text-slate-900 mb-1">${card.t}</h3>
          <p class="text-sm text-slate-500 leading-relaxed">${card.d}</p>
        </div>`).join('');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${c.nameAr}</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
<style>body{font-family:'Tajawal',sans-serif}</style>
</head>
<body class="bg-slate-50 text-slate-800">
  <header class="relative">
    <div class="absolute inset-0">
      <img src="${c.hero}" class="w-full h-full object-cover" alt="">
      <div class="absolute inset-0" style="background:linear-gradient(90deg,${c.accent}e6,${c.accent}99)"></div>
    </div>
    <nav class="relative max-w-6xl mx-auto px-6 py-5 flex items-center justify-between text-white">
      <span class="font-extrabold text-xl">${c.nameAr}</span>
      <div class="hidden md:flex gap-6 text-sm font-medium">
        <a href="#about" class="hover:opacity-80">عن الخدمة</a>
        <a href="#features" class="hover:opacity-80">المميزات</a>
        <a href="#contact" class="hover:opacity-80">تواصل</a>
      </div>
      <a href="#contact" class="bg-white text-slate-900 px-4 py-2 rounded-xl text-sm font-bold">${c.cta}</a>
    </nav>
    <div class="relative max-w-6xl mx-auto px-6 py-24 md:py-32 text-white text-center">
      <p class="inline-block bg-white/20 backdrop-blur px-4 py-1 rounded-full text-sm mb-5">${c.badge}</p>
      <h1 class="text-4xl md:text-6xl font-extrabold leading-tight mb-5 max-w-3xl mx-auto">${c.headline}</h1>
      <p class="text-lg text-white/90 max-w-2xl mx-auto mb-8">${c.sub}</p>
      <a href="#contact" class="inline-block bg-white text-slate-900 font-bold px-8 py-3.5 rounded-xl hover:bg-slate-100 transition-colors">${c.cta}</a>
    </div>
  </header>

  <section id="features" class="max-w-6xl mx-auto px-6 py-20">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-extrabold text-slate-900 mb-2">${c.sectionTitle}</h2>
      <p class="text-slate-500">${c.sectionSub}</p>
    </div>
    <div class="grid md:grid-cols-3 gap-6">${cards}</div>
  </section>

  <section id="about" class="bg-white border-y border-slate-100">
    <div class="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10 items-center">
      <img src="${c.hero}" class="rounded-3xl w-full h-72 object-cover" alt="">
      <div>
        <h2 class="text-3xl font-extrabold text-slate-900 mb-4">${c.aboutTitle}</h2>
        <p class="text-slate-500 leading-relaxed mb-6">${c.aboutBody}</p>
        <div class="flex gap-8">
          ${c.stats.map(s => `<div><div class="text-3xl font-extrabold" style="color:${c.accent}">${s.n}</div><div class="text-sm text-slate-500">${s.l}</div></div>`).join('')}
        </div>
      </div>
    </div>
  </section>

  <section id="contact" class="max-w-2xl mx-auto px-6 py-20">
    <div class="text-center mb-8">
      <h2 class="text-3xl font-extrabold text-slate-900 mb-2">${c.formTitle}</h2>
      <p class="text-slate-500">${c.formSub}</p>
    </div>
    <form class="bg-white rounded-3xl border border-slate-100 shadow-sm p-7 space-y-4">
      <input name="name" required placeholder="الاسم الكامل" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-slate-400">
      <div class="grid sm:grid-cols-2 gap-4">
        <input name="email" type="email" required placeholder="البريد الإلكتروني" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-slate-400">
        <input name="phone" placeholder="رقم الهاتف" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-slate-400">
      </div>
      <textarea name="message" rows="3" placeholder="${c.formPlaceholder}" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-slate-400"></textarea>
      <button type="submit" class="w-full text-white font-bold py-3.5 rounded-xl transition-opacity hover:opacity-90" style="background:${c.accent}">${c.cta}</button>
      <p class="text-center text-xs text-slate-400">سنعاود التواصل معك خلال ٢٤ ساعة</p>
    </form>
  </section>

  <footer class="bg-slate-900 text-slate-400 text-center py-8 text-sm">
    © ${new Date().getFullYear()} ${c.nameAr} — ${c.nameEn}
  </footer>
</body>
</html>`;
}

const TEMPLATES = [
  {
    category: 'food', price: 0, nameEn: 'Zaatar House', nameAr: 'بيت الزعتر', author: 'Lina Haddad',
    thumbnail: thumb('photo-1517248135467-4c7edcad34c4'), hero: img('photo-1517248135467-4c7edcad34c4'),
    accent: '#b45309', badge: 'مطبخ شرقي أصيل', cta: 'احجز طاولة',
    headline: 'نكهات تروي حكاية كل بيت', sub: 'مطعم عائلي يقدّم أشهى الأطباق الشرقية بمكوّنات طازجة يومياً.',
    sectionTitle: 'لماذا بيت الزعتر؟', sectionSub: 'تجربة طعام لا تُنسى',
    cards: [{ icon: '🍽️', t: 'مكوّنات طازجة', d: 'نختار أجود المنتجات المحلية كل صباح.' }, { icon: '👨‍🍳', t: 'طهاة محترفون', d: 'خبرة تتجاوز ٢٠ عاماً في المطبخ الشرقي.' }, { icon: '🚚', t: 'توصيل سريع', d: 'يصلك طلبك ساخناً خلال ٣٠ دقيقة.' }],
    aboutTitle: 'قصتنا', aboutBody: 'بدأنا كمطعم صغير وكبرنا بحب عملائنا. اليوم نقدّم أكثر من ٦٠ طبقاً تجمع الأصالة والإبداع.',
    stats: [{ n: '+60', l: 'طبق' }, { n: '+15K', l: 'عميل سعيد' }, { n: '4.9★', l: 'تقييم' }],
    formTitle: 'احجز طاولتك', formSub: 'املأ النموذج وسنؤكد حجزك', formPlaceholder: 'عدد الأشخاص والوقت المفضّل', desc: 'موقع مطعم أنيق مع قائمة طعام وحجوزات.',
  },
  {
    category: 'ecommerce', price: 0, nameEn: 'Noon Boutique', nameAr: 'بوتيك نُون', author: 'Sara Nasser',
    thumbnail: thumb('photo-1441986300917-64674bd600d8'), hero: img('photo-1441986300917-64674bd600d8'),
    accent: '#9333ea', badge: 'تشكيلة ٢٠٢٦', cta: 'تسوّق الآن',
    headline: 'أناقة تُفصّل على ذوقك', sub: 'متجر أزياء عصري يقدّم أحدث القطع بجودة عالية وأسعار تنافسية.',
    sectionTitle: 'لماذا نُون؟', sectionSub: 'تجربة تسوّق مميزة',
    cards: [{ icon: '🛍️', t: 'قطع حصرية', d: 'تصاميم محدودة لا تجدها في مكان آخر.' }, { icon: '↩️', t: 'إرجاع مجاني', d: 'استرجاع خلال ١٤ يوماً دون أسئلة.' }, { icon: '🔒', t: 'دفع آمن', d: 'بوابات دفع موثوقة ومشفّرة.' }],
    aboutTitle: 'عن المتجر', aboutBody: 'نُون علامة أزياء تؤمن أن الأناقة حق للجميع. نختار كل قطعة بعناية لتناسب يومك.',
    stats: [{ n: '+500', l: 'منتج' }, { n: '+30K', l: 'طلب' }, { n: '4.8★', l: 'تقييم' }],
    formTitle: 'انضمّ لقائمتنا', formSub: 'احصل على خصم ١٥٪ على أول طلب', formPlaceholder: 'ما الذي تبحث عنه؟', desc: 'متجر أزياء بشبكة منتجات ونشرة بريدية.',
  },
  {
    category: 'realestate', price: 19, nameEn: 'Dar Realty', nameAr: 'دار العقارية', author: 'Hana Yousef',
    thumbnail: thumb('photo-1560518883-ce09059eeffa'), hero: img('photo-1560518883-ce09059eeffa'),
    accent: '#0f766e', badge: 'عقارات مختارة', cta: 'استعلم الآن',
    headline: 'بيتك القادم على بُعد خطوة', sub: 'نساعدك في إيجاد العقار المثالي للسكن أو الاستثمار بأفضل الأسعار.',
    sectionTitle: 'خدماتنا', sectionSub: 'من البحث إلى التملّك',
    cards: [{ icon: '🏠', t: 'تشكيلة واسعة', d: 'شقق وفلل ومكاتب في أرقى المواقع.' }, { icon: '📊', t: 'استشارة استثمارية', d: 'نحلّل السوق لنرشدك لأفضل صفقة.' }, { icon: '🤝', t: 'وسطاء معتمدون', d: 'فريق موثوق يرافقك خطوة بخطوة.' }],
    aboutTitle: 'من نحن', aboutBody: 'دار العقارية شريكك الموثوق منذ ٢٠١٠. أنجزنا آلاف الصفقات بثقة وشفافية كاملة.',
    stats: [{ n: '+2K', l: 'عقار' }, { n: '+8K', l: 'صفقة' }, { n: '14', l: 'سنة خبرة' }],
    formTitle: 'اطلب استشارة مجانية', formSub: 'أخبرنا بما تبحث عنه', formPlaceholder: 'نوع العقار والميزانية', desc: 'موقع عقارات مع قوائم ونموذج استعلام.',
  },
  {
    category: 'health', price: 0, nameEn: 'Shifa Clinic', nameAr: 'عيادة شفاء', author: 'Nour Fares',
    thumbnail: thumb('photo-1576091160550-2173dba999ef'), hero: img('photo-1576091160550-2173dba999ef'),
    accent: '#0284c7', badge: 'رعاية تثق بها', cta: 'احجز موعد',
    headline: 'صحتك تستحق أفضل رعاية', sub: 'عيادة متكاملة بأحدث الأجهزة وفريق طبي متخصص في خدمتك.',
    sectionTitle: 'تخصصاتنا', sectionSub: 'رعاية شاملة لكل أفراد العائلة',
    cards: [{ icon: '🩺', t: 'كشف دقيق', d: 'تشخيص متقدم بأحدث التقنيات.' }, { icon: '📅', t: 'حجز سهل', d: 'احجز موعدك أونلاين في دقائق.' }, { icon: '💙', t: 'متابعة مستمرة', d: 'نرافق رحلتك العلاجية حتى التعافي.' }],
    aboutTitle: 'عن العيادة', aboutBody: 'نقدّم رعاية صحية إنسانية تضع المريض أولاً، بفريق من نخبة الأطباء المعتمدين.',
    stats: [{ n: '+20', l: 'طبيب' }, { n: '+50K', l: 'مريض' }, { n: '4.9★', l: 'رضا' }],
    formTitle: 'احجز موعدك', formSub: 'سنؤكد الموعد هاتفياً', formPlaceholder: 'التخصص والوقت المفضّل', desc: 'موقع عيادة طبية مع الخدمات وحجز المواعيد.',
  },
  {
    category: 'fitness', price: 0, nameEn: 'PowerFit Gym', nameAr: 'نادي القوة', author: 'Marco Silva',
    thumbnail: thumb('photo-1534438327276-14e5300c3a48'), hero: img('photo-1534438327276-14e5300c3a48'),
    accent: '#dc2626', badge: 'ابدأ تحوّلك', cta: 'اشترك الآن',
    headline: 'قوّتك تبدأ من هنا', sub: 'نادٍ رياضي مجهّز بالكامل مع مدرّبين محترفين وبرامج مخصّصة لهدفك.',
    sectionTitle: 'برامجنا', sectionSub: 'لكل هدف خطة',
    cards: [{ icon: '💪', t: 'تدريب شخصي', d: 'خطط مصمّمة حسب جسمك وهدفك.' }, { icon: '🏋️', t: 'أجهزة حديثة', d: 'أحدث المعدّات في كل قسم.' }, { icon: '🥗', t: 'استشارة تغذية', d: 'نظام غذائي يكمّل تمارينك.' }],
    aboutTitle: 'عن النادي', aboutBody: 'أكثر من مجرد صالة — مجتمع يحفّزك على الأفضل. انضم لآلاف المتدربين الذين غيّروا حياتهم.',
    stats: [{ n: '+5K', l: 'عضو' }, { n: '+40', l: 'حصة أسبوعياً' }, { n: '24/7', l: 'دوام' }],
    formTitle: 'احجز حصة تجريبية مجانية', formSub: 'جرّب قبل أن تشترك', formPlaceholder: 'هدفك من التمرين', desc: 'موقع نادٍ رياضي مع الحصص والاشتراكات.',
  },
  {
    category: 'events', price: 25, nameEn: 'Layali Weddings', nameAr: 'ليالي للأعراس', author: 'Layla Mansour',
    thumbnail: thumb('photo-1519225421980-715cb0215aed'), hero: img('photo-1519225421980-715cb0215aed'),
    accent: '#be185d', badge: 'يومك المثالي', cta: 'احجز موعد',
    headline: 'نحوّل حلمك إلى ليلة لا تُنسى', sub: 'تنظيم أعراس ومناسبات متكامل من الفكرة حتى آخر لحظة.',
    sectionTitle: 'باقاتنا', sectionSub: 'كل التفاصيل في مكان واحد',
    cards: [{ icon: '💍', t: 'تنظيم كامل', d: 'نتولّى كل شيء لتستمتع بيومك.' }, { icon: '🎀', t: 'ديكور فاخر', d: 'تصاميم تأسر الأنظار.' }, { icon: '📸', t: 'توثيق احترافي', d: 'نخلّد لحظاتك بأجمل صورة.' }],
    aboutTitle: 'عنّا', aboutBody: 'فريق شغوف بالتفاصيل نظّم مئات الأعراس الناجحة. حلمك أمانة بين أيدينا.',
    stats: [{ n: '+400', l: 'عرس' }, { n: '+50', l: 'شريك' }, { n: '5★', l: 'تقييم' }],
    formTitle: 'احجز استشارة', formSub: 'لنبدأ التخطيط ليومك', formPlaceholder: 'تاريخ المناسبة وعدد الضيوف', desc: 'موقع تنظيم أعراس مع الباقات ونموذج حجز.',
  },
  {
    category: 'travel', price: 0, nameEn: 'Horizon Travel', nameAr: 'رحلات الأفق', author: 'Ines Dubois',
    thumbnail: thumb('photo-1469854523086-cc02fe5d8800'), hero: img('photo-1469854523086-cc02fe5d8800'),
    accent: '#0891b2', badge: 'وجهات تنتظرك', cta: 'خطّط رحلتك',
    headline: 'العالم أقرب مما تظن', sub: 'باقات سفر مصمّمة بعناية لتعيش مغامرة العمر بأفضل سعر.',
    sectionTitle: 'لماذا نحن؟', sectionSub: 'سفر بلا متاعب',
    cards: [{ icon: '✈️', t: 'باقات شاملة', d: 'طيران وإقامة وجولات في حزمة واحدة.' }, { icon: '🗺️', t: 'وجهات متنوّعة', d: 'أكثر من ٤٠ وجهة حول العالم.' }, { icon: '🛎️', t: 'دعم ٢٤/٧', d: 'نرافقك في كل خطوة من رحلتك.' }],
    aboutTitle: 'عن الوكالة', aboutBody: 'نصمّم رحلات تناسب أحلامك وميزانيتك. خبرتنا تضمن لك تجربة سلسة من الحجز حتى العودة.',
    stats: [{ n: '+40', l: 'وجهة' }, { n: '+25K', l: 'مسافر' }, { n: '4.8★', l: 'تقييم' }],
    formTitle: 'اطلب عرض رحلة', formSub: 'صمّم رحلتك معنا', formPlaceholder: 'الوجهة والتواريخ', desc: 'موقع وكالة سفر مع الوجهات وطلب رحلة.',
  },
  {
    category: 'education', price: 0, nameEn: 'Knowledge Academy', nameAr: 'أكاديمية المعرفة', author: 'Aisha Rahman',
    thumbnail: thumb('photo-1513258496099-48168024aec0'), hero: img('photo-1513258496099-48168024aec0'),
    accent: '#4f46e5', badge: 'تعلّم بلا حدود', cta: 'سجّل الآن',
    headline: 'استثمر في نفسك، ابدأ التعلّم', sub: 'منصة دورات أونلاين باحتراف، شهادات معتمدة ومدرّبون خبراء.',
    sectionTitle: 'لماذا أكاديميتنا؟', sectionSub: 'تعليم يصنع الفرق',
    cards: [{ icon: '🎓', t: 'شهادات معتمدة', d: 'وثّق مهاراتك بشهادات معترف بها.' }, { icon: '🎥', t: 'محتوى عملي', d: 'دروس تطبيقية بأمثلة من الواقع.' }, { icon: '⏱️', t: 'تعلّم بمرونة', d: 'ادرس في أي وقت ومن أي مكان.' }],
    aboutTitle: 'عن الأكاديمية', aboutBody: 'نؤمن أن التعليم يغيّر الحياة. نقدّم دورات في التقنية والأعمال والتصميم بجودة عالية.',
    stats: [{ n: '+120', l: 'دورة' }, { n: '+40K', l: 'طالب' }, { n: '4.9★', l: 'تقييم' }],
    formTitle: 'سجّل اهتمامك', formSub: 'سنرسل لك تفاصيل الدورات', formPlaceholder: 'المجال الذي يهمّك', desc: 'منصة دورات أونلاين مع المنهج والتسجيل.',
  },
];

// Categorize + add bilingual names to the original starter projects so the
// whole gallery is classified and complete (no orphans).
const EXISTING_META = [
  ['SaaS Landing Page', 'saas', 'صفحة منتج SaaS', 'SaaS Landing Page'],
  ['Modern Login UI', 'saas', 'واجهة تسجيل دخول', 'Modern Login UI'],
  ['Pricing Page', 'saas', 'صفحة أسعار', 'Pricing Page'],
  ['Coming Soon', 'saas', 'قريباً', 'Coming Soon'],
  ['Personal Portfolio', 'portfolio', 'بورتفوليو شخصي', 'Personal Portfolio'],
  ['Link in Bio', 'portfolio', 'رابط في البايو', 'Link in Bio'],
  ['Photo Gallery', 'portfolio', 'معرض صور', 'Photo Gallery'],
  ['Restaurant Menu', 'food', 'قائمة مطعم', 'Restaurant Menu'],
  ['Admin Dashboard Widget', 'saas', 'لوحة تحكم', 'Admin Dashboard Widget'],
  ['Todo App', 'tools', 'تطبيق مهام', 'Todo App'],
  ['Pomodoro Timer', 'tools', 'مؤقّت بومودورو', 'Pomodoro Timer'],
  ['Expense Tracker', 'tools', 'متتبّع المصاريف', 'Expense Tracker'],
  ['Notes', 'tools', 'ملاحظات', 'Notes'],
];

async function main() {
  const { rows: u } = await pool.query(
    `INSERT INTO users (email, name, password_hash, plan, role)
     VALUES ($1, $2, 'noop', 'enterprise', 'admin')
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id, name`,
    [SYSTEM_EMAIL, SYSTEM_NAME]
  );
  const authorId = u[0].id;

  for (const t of TEMPLATES) {
    const code = buildPage(t);
    const likes = Math.floor(Math.random() * 400) + 80;
    const views = likes * (Math.floor(Math.random() * 8) + 4);
    const { rows: existing } = await pool.query(
      'SELECT id FROM projects WHERE name = $1 AND user_id = $2', [t.nameEn, authorId]
    );
    if (existing.length > 0) {
      await pool.query(
        `UPDATE projects SET description=$1, thumbnail_url=$2, price=$3, code=$4, author=$5,
                category=$6, name_ar=$7, name_en=$8, is_public=true WHERE id=$9`,
        [t.desc, t.thumbnail, t.price, code, t.author, t.category, t.nameAr, t.nameEn, existing[0].id]
      );
      console.log(`Updated template: ${t.nameEn}`);
    } else {
      await pool.query(
        `INSERT INTO projects (user_id, name, description, thumbnail_url, price, code, author,
                category, name_ar, name_en, is_public, likes, views)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,$11,$12)`,
        [authorId, t.nameEn, t.desc, t.thumbnail, t.price, code, t.author, t.category, t.nameAr, t.nameEn, likes, views]
      );
      console.log(`Inserted template: ${t.nameEn}`);
    }
  }

  for (const [name, category, nameAr, nameEn] of EXISTING_META) {
    await pool.query(
      `UPDATE projects SET category=$1, name_ar=$2, name_en=$3 WHERE name=$4 AND user_id=$5`,
      [category, nameAr, nameEn, name, authorId]
    );
  }
  console.log('Template seeding complete.');
  await pool.end();
}

main().catch(err => { console.error('Seed failed:', err); process.exit(1); });
