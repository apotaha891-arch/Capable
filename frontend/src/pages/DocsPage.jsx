import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Home, Zap, User, Wand2, MessageSquare, LayoutGrid, Code2, Rocket, Globe,
  Server, Coins, Store, Trophy, Sparkles, CreditCard, Languages, HelpCircle,
  Search, ChevronDown, Info, CheckCircle2, AlertTriangle, ArrowLeft,
} from 'lucide-react';
import { useLang } from '../i18n/LangContext.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import LangToggle from '../components/LangToggle.jsx';
import Logo from '../components/Logo.jsx';

// Bilingual helper: render Arabic or English given the active language.
const L = (lang, en, ar) => (lang === 'ar' ? ar : en);

/* ── Themed content primitives (RTL-aware via the global <html dir>) ───────── */
function H2({ children }) {
  return <h2 className="text-lg font-bold text-capable-navy dark:text-white mt-8 mb-3">{children}</h2>;
}
function P({ children }) {
  return <p className="text-[15px] leading-7 text-capable-text dark:text-slate-300 mb-3">{children}</p>;
}
function Code({ children }) {
  return <code className="font-mono text-[13px] px-1.5 py-0.5 rounded bg-capable-surface dark:bg-slate-800 text-capable-navy dark:text-indigo-300 border border-gray-200 dark:border-slate-700" dir="ltr">{children}</code>;
}
function Callout({ type = 'info', children }) {
  const styles = {
    info: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-capable-text dark:text-slate-200',
    success: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-capable-text dark:text-slate-200',
    warn: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-capable-text dark:text-slate-200',
  };
  const Icon = type === 'success' ? CheckCircle2 : type === 'warn' ? AlertTriangle : Info;
  const iconColor = type === 'success' ? 'text-emerald-500' : type === 'warn' ? 'text-amber-500' : 'text-indigo-500 dark:text-indigo-400';
  return (
    <div className={`flex gap-2.5 items-start rounded-xl border p-3.5 my-4 text-sm leading-6 ${styles[type]}`}>
      <Icon size={17} className={`mt-0.5 shrink-0 ${iconColor}`} />
      <div>{children}</div>
    </div>
  );
}
function Steps({ items }) {
  return (
    <ol className="my-4 space-y-3">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3 items-start">
          <span className="w-6 h-6 shrink-0 rounded-full bg-capable-navy dark:bg-indigo-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
          <div>
            <div className="text-sm font-semibold text-capable-navy dark:text-white">{it.t}</div>
            <div className="text-sm text-capable-muted dark:text-slate-400 leading-6">{it.d}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
function Table({ head, rows }) {
  return (
    <div className="my-4 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-capable-surface dark:bg-slate-800/60">
            {head.map((h, i) => <th key={i} className="text-start font-semibold text-capable-text dark:text-slate-200 px-3 py-2 border-b border-gray-200 dark:border-slate-700">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-gray-100 dark:border-slate-800 last:border-0">
              {r.map((c, j) => <td key={j} className="px-3 py-2 text-capable-text dark:text-slate-300 align-top leading-6">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Faq({ q, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 mb-2 overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className={`w-full flex items-center justify-between gap-3 text-start px-4 py-3 text-sm font-semibold transition-colors ${open ? 'text-capable-navy dark:text-white bg-indigo-50 dark:bg-slate-800/60' : 'text-capable-text dark:text-slate-200 hover:bg-capable-surface dark:hover:bg-slate-800/40'}`}>
        {q}
        <ChevronDown size={16} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 py-3 text-sm text-capable-muted dark:text-slate-400 leading-7 border-t border-gray-100 dark:border-slate-800">{children}</div>}
    </div>
  );
}

/* ── Sections. Each: id, group, icon, title {en,ar}, keywords, Body(lang). ── */
const GROUPS = {
  overview: { en: 'Overview', ar: 'نظرة عامة' },
  building: { en: 'Building', ar: 'البناء' },
  deploy: { en: 'Deploy', ar: 'النشر' },
  platform: { en: 'Platform', ar: 'المنصة' },
  help: { en: 'Help', ar: 'المساعدة' },
};

const SECTIONS = [
  {
    id: 'intro', group: 'overview', icon: Home,
    title: { en: 'What is Capable?', ar: 'ما هو كيبابل؟' },
    keywords: 'about intro overview arabic mvp',
    Body: (lang) => (<>
      <P>{L(lang,
        'Capable is an Arabic-first platform that turns your idea into a working web product. Describe what you want — in Arabic or English — and Capable builds a real, editable, publishable site. No code required.',
        'كيبابل منصة عربية أولاً تحوّل فكرتك إلى منتج ويب يعمل. صِف ما تريد — بالعربية أو الإنجليزية — وكيبابل يبني لك موقعاً حقيقياً قابلاً للتعديل والنشر. بدون أي برمجة.')}</P>
      <H2>{L(lang, 'Two ways to build', 'طريقتان للبناء')}</H2>
      <P>{L(lang,
        'A structured blueprint builder for guided, section-by-section sites, and a code editor for full HTML control. Paid plans let you convert a blueprint project into editable code.',
        'مُنشئ مخططات منظّم لبناء موقع موجّه قسماً بقسم، ومحرّر أكواد لتحكّم كامل بالـ HTML. تتيح الباقات المدفوعة تحويل مشروع المخطط إلى كود قابل للتعديل.')}</P>
      <Callout type="info">{L(lang,
        <>Capable is built for <strong>validation</strong> — ship fast, test with real users, then invest in scaling what works.</>,
        <>كيبابل مصمّم <strong>للتحقّق من الأفكار</strong> — أطلق بسرعة، اختبر مع مستخدمين حقيقيين، ثم استثمر في توسيع ما ينجح.</>)}</Callout>
    </>),
  },
  {
    id: 'quickstart', group: 'overview', icon: Zap,
    title: { en: 'Quickstart', ar: 'البداية السريعة' },
    keywords: 'start first project deploy 5 minutes',
    Body: (lang) => (<>
      <P>{L(lang, 'From zero to a live, shareable site in a few minutes.', 'من الصفر إلى موقع منشور قابل للمشاركة خلال دقائق.')}</P>
      <Steps items={[
        { t: L(lang, 'Create your account', 'أنشئ حسابك'), d: L(lang, 'Sign up with your email. The Arabic interface is available from the first screen.', 'سجّل ببريدك الإلكتروني. الواجهة العربية متاحة من أول شاشة.') },
        { t: L(lang, 'Start a new project', 'ابدأ مشروعاً جديداً'), d: L(lang, 'From your dashboard, click New Project to open the builder.', 'من لوحة التحكم، اضغط «مشروع جديد» لفتح المُنشئ.') },
        { t: L(lang, 'Describe your idea', 'صِف فكرتك'), d: L(lang, 'Write what you want in Arabic or English. The more specific, the better.', 'اكتب ما تريد بالعربية أو الإنجليزية. كلما زاد التحديد، كانت النتيجة أفضل.') },
        { t: L(lang, 'Refine in chat', 'حسّن عبر المحادثة'), d: L(lang, 'Send follow-up messages to change colors, add sections, or switch language.', 'أرسل رسائل متابعة لتغيير الألوان أو إضافة أقسام أو تبديل اللغة.') },
        { t: L(lang, 'Publish & share', 'انشر وشارك'), d: L(lang, 'Publish to get a free shareable Capable link. Connect your own domain anytime on a paid plan.', 'انشر لتحصل على رابط كيبابل مجاني قابل للمشاركة. اربط نطاقك الخاص في أي وقت ضمن باقة مدفوعة.') },
      ]} />
      <Callout type="success">{L(lang, 'Getting started is free. No credit card required.', 'البدء مجاني. لا حاجة لبطاقة ائتمان.')}</Callout>
      <H2>{L(lang, 'Keyboard shortcut', 'اختصار لوحة المفاتيح')}</H2>
      <P>{L(lang, <>Press <Code>Ctrl + Enter</Code> in the prompt box to generate. <Code>Shift + Enter</Code> adds a new line.</>,
        <>اضغط <Code>Ctrl + Enter</Code> في مربع الكتابة للتوليد. <Code>Shift + Enter</Code> يضيف سطراً جديداً.</>)}</P>
    </>),
  },
  {
    id: 'builder', group: 'building', icon: Wand2,
    title: { en: 'AI Builder', ar: 'مُنشئ الذكاء الاصطناعي' },
    keywords: 'ai builder chat preview generate',
    Body: (lang) => (<>
      <P>{L(lang,
        'The AI Builder turns plain-language descriptions into working sites with correct RTL layout, realistic content, and responsive design. You chat on one side and watch the live preview update on the other.',
        'يحوّل مُنشئ الذكاء وصفك بلغة طبيعية إلى مواقع تعمل بتخطيط RTL صحيح، ومحتوى واقعي، وتصميم متجاوب. تكتب في جهة وتشاهد المعاينة المباشرة تتحدّث في الجهة الأخرى.')}</P>
      <H2>{L(lang, 'Model tiers', 'مستويات النماذج')}</H2>
      <P>{L(lang,
        'Pick a tier before you generate. Higher tiers review harder and produce better results, but use more credits.',
        'اختر مستوى قبل التوليد. المستويات الأعلى تراجع بدقّة أكبر وتنتج نتائج أفضل، لكنها تستهلك أرصدة أكثر.')}</P>
      <Table head={[L(lang, 'Tier', 'المستوى'), L(lang, 'Best for', 'الأنسب لـ')]} rows={[
        ['Capable 1', L(lang, 'Fast & economical drafts', 'مسودّات سريعة واقتصادية')],
        ['Capable 2', L(lang, 'Higher quality, deeper review', 'جودة أعلى ومراجعة أدق')],
        ['Capable 3', L(lang, 'Top quality (uses the most credits)', 'أعلى جودة (الأكثر استهلاكاً للأرصدة)')],
      ]} />
      <Callout type="warn">{L(lang,
        'Each AI generation uses credits. For tiny edits (a single word, a color), use the code editor instead — it is always free.',
        'كل عملية توليد تستهلك أرصدة. للتعديلات الصغيرة (كلمة واحدة، لون)، استخدم محرّر الأكواد بدلاً من ذلك — فهو مجاني دائماً.')}</Callout>
    </>),
  },
  {
    id: 'prompting', group: 'building', icon: MessageSquare,
    title: { en: 'Prompting guide', ar: 'دليل كتابة التعليمات' },
    keywords: 'prompt arabic examples how to ask',
    Body: (lang) => (<>
      <P>{L(lang,
        'A strong prompt names four things: what the site is, who it is for, what sections it needs, and what action users should take.',
        'التعليمة القوية تذكر أربعة أشياء: ما هو الموقع، لمن، ما الأقسام التي يحتاجها، وما الإجراء الذي تريد أن يقوم به المستخدم.')}</P>
      <div className="rounded-xl bg-capable-surface dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 p-4 my-4">
        <div className="text-[10px] uppercase tracking-wider text-capable-muted dark:text-slate-400 mb-2">{L(lang, 'Strong example', 'مثال قوي')}</div>
        <div dir="rtl" className="text-[15px] text-capable-navy dark:text-indigo-200 leading-7">موقع لمطعم شاورما في جدة، مع قائمة الطعام، آراء العملاء، وزر «اطلب الآن» يفتح واتساب للطلبات.</div>
      </div>
      <H2>{L(lang, 'Follow-up patterns', 'أنماط المتابعة')}</H2>
      <Table head={[L(lang, 'You want', 'ما تريده'), L(lang, 'How to ask', 'كيف تطلبه')]} rows={[
        [L(lang, 'Change colors', 'تغيير الألوان'), L(lang, '“change the palette to navy and white”', '«غيّر الألوان إلى كحلي وأبيض»')],
        [L(lang, 'Add a section', 'إضافة قسم'), L(lang, '“add a pricing section with two plans”', '«أضف قسم أسعار بباقتين»')],
        [L(lang, 'Switch language', 'تبديل اللغة'), L(lang, '“translate the whole site to English”', '«حوّل الموقع كاملاً للإنجليزية»')],
      ]} />
      <Callout type="info">{L(lang,
        <>You can mix languages: <em>“أضف hero section with a countdown timer”</em> works fine.</>,
        <>يمكنك المزج بين اللغتين: <em>«أضف hero section with a countdown timer»</em> يعمل تماماً.</>)}</Callout>
      <H2>{L(lang, 'What the AI cannot do', 'ما لا يستطيع الذكاء فعله')}</H2>
      <P>{L(lang,
        'The builder generates front-end sites. It does not connect to live databases, process real payments, or send real emails on its own — integrate external services (e.g. Stripe, a form backend) for that.',
        'يُنشئ المُنشئ مواقع واجهة أمامية. لا يتصل بقواعد بيانات حيّة ولا يعالج مدفوعات حقيقية ولا يرسل بريداً فعلياً من تلقاء نفسه — اربط خدمات خارجية (مثل Stripe أو خدمة نماذج) لذلك.')}</P>
    </>),
  },
  {
    id: 'templates', group: 'building', icon: LayoutGrid,
    title: { en: 'Templates & gallery', ar: 'القوالب والمعرض' },
    keywords: 'templates gallery clone starter',
    Body: (lang) => (<>
      <P>{L(lang,
        'Start from a template chip to pre-fill a structured prompt, or browse the gallery of published community projects and clone any of them as your own editable copy.',
        'ابدأ من قالب جاهز لتعبئة تعليمة منظّمة، أو تصفّح معرض مشاريع المجتمع المنشورة واستنسخ أيّاً منها كنسخة قابلة للتعديل خاصة بك.')}</P>
      <Callout type="info">{L(lang,
        'Cloning a project is free — your credits are only used when you make AI changes to the clone.',
        'استنساخ مشروع مجاني — تُستخدم أرصدتك فقط عند إجراء تعديلات بالذكاء على النسخة.')}</Callout>
    </>),
  },
  {
    id: 'editor', group: 'building', icon: Code2,
    title: { en: 'Code editor', ar: 'محرّر الأكواد' },
    keywords: 'code editor html export tokens free',
    Body: (lang) => (<>
      <P>{L(lang,
        'The code editor gives you direct access to your project’s HTML, CSS, and JS without using any credits. Edits show in the live preview instantly.',
        'يمنحك محرّر الأكواد وصولاً مباشراً إلى HTML وCSS وJS لمشروعك دون استهلاك أي أرصدة. تظهر التعديلات في المعاينة المباشرة فوراً.')}</P>
      <H2>{L(lang, 'Editor vs AI chat', 'المحرّر مقابل محادثة الذكاء')}</H2>
      <Table head={[L(lang, 'Task', 'المهمة'), L(lang, 'Use', 'استخدم'), L(lang, 'Credits', 'الأرصدة')]} rows={[
        [L(lang, 'Fix a typo / change a word', 'تصحيح خطأ / تغيير كلمة'), L(lang, 'Code editor', 'محرّر الأكواد'), L(lang, 'Free', 'مجاني')],
        [L(lang, 'Change a color', 'تغيير لون'), L(lang, 'Code editor', 'محرّر الأكواد'), L(lang, 'Free', 'مجاني')],
        [L(lang, 'Add a new section', 'إضافة قسم جديد'), L(lang, 'AI chat', 'محادثة الذكاء'), L(lang, 'Uses credits', 'يستهلك أرصدة')],
        [L(lang, 'Restructure layout', 'إعادة هيكلة التخطيط'), L(lang, 'AI chat', 'محادثة الذكاء'), L(lang, 'Uses credits', 'يستهلك أرصدة')],
      ]} />
      <Callout type="warn">{L(lang,
        'A new AI generation can overwrite manual edits in the same sections. Save your work before large AI changes.',
        'قد تستبدل عملية توليد جديدة تعديلاتك اليدوية في نفس الأقسام. احفظ عملك قبل التغييرات الكبيرة بالذكاء.')}</Callout>
    </>),
  },
  {
    id: 'deploy', group: 'deploy', icon: Rocket,
    title: { en: 'Publishing & deploy', ar: 'النشر والإطلاق' },
    keywords: 'deploy publish live link share',
    Body: (lang) => (<>
      <P>{L(lang,
        'Publishing makes your project live on a free, shareable Capable link with SSL included. Share it, gather feedback, and validate. Re-publish anytime to push updates.',
        'النشر يجعل مشروعك مباشراً على رابط كيبابل مجاني قابل للمشاركة مع شهادة SSL. شاركه، اجمع الملاحظات، وتحقّق من فكرتك. أعد النشر في أي وقت لدفع التحديثات.')}</P>
      <Callout type="info">{L(lang,
        'Want your own brand domain instead of a Capable link? See Custom domains — available on paid plans.',
        'تريد نطاقك الخاص بدل رابط كيبابل؟ راجع «النطاقات المخصصة» — متاحة في الباقات المدفوعة.')}</Callout>
    </>),
  },
  {
    id: 'domains', group: 'deploy', icon: Globe,
    title: { en: 'Custom domains', ar: 'النطاقات المخصصة' },
    keywords: 'custom domain dns cname txt ssl',
    Body: (lang) => (<>
      <P>{L(lang,
        'Connect a domain you already own to a project. Custom domains are a paid feature (the Influence plan includes one; Pro adds more). Capable connects to your domain — it does not sell registrations.',
        'اربط نطاقاً تملكه بمشروعك. النطاقات المخصصة ميزة مدفوعة (باقة التأثير تشمل نطاقاً واحداً؛ Pro يضيف المزيد). كيبابل يربط نطاقك — ولا يبيع تسجيل النطاقات.')}</P>
      <Steps items={[
        { t: L(lang, 'Open Project → Settings → Deployment', 'افتح المشروع ← الإعدادات ← النشر'), d: L(lang, 'Enter your domain (apex or subdomain).', 'أدخل نطاقك (رئيسي أو فرعي).') },
        { t: L(lang, 'Add the DNS records', 'أضف سجلّات DNS'), d: L(lang, 'Capable shows the exact TXT and CNAME records to add at your registrar.', 'يعرض كيبابل سجلّي TXT وCNAME الدقيقين لإضافتهما عند مزوّد نطاقك.') },
        { t: L(lang, 'Verify', 'تحقّق'), d: L(lang, 'Click Verify. Once the records propagate, SSL is provisioned automatically.', 'اضغط «تحقّق». بمجرد انتشار السجلّات، تُصدَر شهادة SSL تلقائياً.') },
      ]} />
      <Callout type="warn">{L(lang,
        <>DNS can take 15 minutes to a few hours to propagate. Cloudflare users: set the record to <strong>DNS-only</strong> (gray cloud) during verification.</>,
        <>قد يستغرق انتشار DNS من 15 دقيقة إلى ساعات. لمستخدمي Cloudflare: اضبط السجل على <strong>DNS فقط</strong> (السحابة الرمادية) أثناء التحقّق.</>)}</Callout>
    </>),
  },
  {
    id: 'credits', group: 'platform', icon: Coins,
    title: { en: 'AI Design Credits', ar: 'أرصدة التصميم الذكي' },
    keywords: 'tokens credits limits usage quota',
    Body: (lang) => (<>
      <P>{L(lang,
        'Credits are used only when the AI builds for you. Clicking, editing text, customizing, previewing, publishing, and cloning are always free. Your plan sets a monthly credit budget plus a daily generation limit.',
        'تُستخدم الأرصدة فقط عندما يبني لك الذكاء. النقر وتعديل النصوص والتخصيص والمعاينة والنشر والاستنساخ مجانية دائماً. تحدّد باقتك ميزانية أرصدة شهرية وحدّاً يومياً لعدد عمليات التوليد.')}</P>
      <H2>{L(lang, 'What is free vs metered', 'ما هو المجاني مقابل المحسوب')}</H2>
      <Table head={[L(lang, 'Action', 'الإجراء'), L(lang, 'Credits', 'الأرصدة')]} rows={[
        [L(lang, 'AI generation / rebuild', 'توليد / إعادة بناء بالذكاء'), L(lang, 'Uses credits', 'يستهلك أرصدة')],
        [L(lang, 'Editing text, colors, code', 'تعديل النصوص والألوان والكود'), L(lang, 'Free', 'مجاني')],
        [L(lang, 'Preview, publish, clone', 'المعاينة والنشر والاستنساخ'), L(lang, 'Free', 'مجاني')],
      ]} />
      <P>{L(lang,
        'When you reach a limit, AI actions pause until the reset — your projects, code, and live sites are never affected. Upgrade for a higher budget.',
        'عند بلوغ الحدّ، تتوقّف إجراءات الذكاء حتى التجديد — دون أي تأثير على مشاريعك أو كودك أو مواقعك المنشورة. رقِّ باقتك لميزانية أكبر.')}</P>
    </>),
  },
  {
    id: 'plans', group: 'platform', icon: CreditCard,
    title: { en: 'Plans & billing', ar: 'الباقات والفوترة' },
    keywords: 'pricing plans pro free billing stripe',
    Body: (lang) => (<>
      <Table head={[L(lang, 'Plan', 'الباقة'), L(lang, 'Price', 'السعر'), L(lang, 'For', 'لـ')]} rows={[
        ['Free', '$0', L(lang, 'Exploring and validating ideas', 'الاستكشاف والتحقّق من الأفكار')],
        ['Pro', '$49 / ' + L(lang, 'month', 'شهر'), L(lang, 'Launching a real product (more credits, custom domain, priority support)', 'إطلاق منتج حقيقي (أرصدة أكثر، نطاق مخصص، دعم بأولوية)')],
        [L(lang, 'Expert help', 'مساعدة الخبراء'), L(lang, 'From $1,000', 'من $1,000'), L(lang, 'A Capable engineer finishes your build', 'مهندس كيبابل يُنهي مشروعك')],
      ]} />
      <P>{L(lang,
        'Payments are handled by Stripe (Visa, Mastercard, and regional cards such as Mada). Manage or cancel anytime from Settings → Billing; cancelling a custom domain returns the project to its free Capable link at the period end — the site stays live.',
        'تُدار المدفوعات عبر Stripe (فيزا، ماستركارد، وبطاقات إقليمية مثل مدى). أدِر أو ألغِ في أي وقت من الإعدادات ← الفوترة؛ إلغاء النطاق المخصص يُعيد المشروع إلى رابط كيبابل المجاني نهاية الفترة — والموقع يبقى مباشراً.')}</P>
    </>),
  },
  {
    id: 'marketplace', group: 'platform', icon: Store,
    title: { en: 'Marketplace', ar: 'المتجر' },
    keywords: 'marketplace modules adopt sell list earn',
    Body: (lang) => (<>
      <P>{L(lang,
        'The Marketplace is where the community shares licensed modules. Adopt a proven module and a copy is added straight to your projects, or list your own and earn on every sale.',
        'المتجر هو حيث يشارك المجتمع وحدات مرخّصة. تبنَّ وحدة مُجرّبة فتُضاف نسخة منها مباشرة إلى مشاريعك، أو انشر وحدتك واكسب من كل عملية بيع.')}</P>
      <Callout type="success">{L(lang, 'Creators earn 70% of each sale as account credit.', 'يكسب المنشئون 70٪ من كل عملية بيع كرصيد على الحساب.')}</Callout>
    </>),
  },
  {
    id: 'challenges', group: 'platform', icon: Trophy,
    title: { en: 'Challenges', ar: 'التحديات' },
    keywords: 'challenges rewards tokens cash prize',
    Body: (lang) => (<>
      <P>{L(lang,
        'Join a challenge, hit the goal within the time window, and win the reward — tokens, credit, or cash. There’s no risk: the platform funds the prizes. Track your progress on the Challenges page.',
        'انضمّ إلى تحدٍّ، حقّق الهدف ضمن المدّة، واربح الجائزة — توكنات أو رصيداً أو نقداً. لا مخاطرة: المنصة تموّل الجوائز. تابع تقدّمك في صفحة التحديات.')}</P>
    </>),
  },
  {
    id: 'influence', group: 'platform', icon: Sparkles,
    title: { en: 'Influence Pass', ar: 'باقة التأثير' },
    keywords: 'influence pass early access roadmap resonance',
    Body: (lang) => (<>
      <P>{L(lang,
        'The Influence Pass gives your account early access to new features, more personalization, and a real say in the roadmap. The more you build, the more your “resonance” weights your votes, experiments, and pricing.',
        'تمنح باقة التأثير حسابك وصولاً مبكراً للميزات الجديدة، وتخصيصاً أكبر، وصوتاً حقيقياً في خارطة الطريق. كلما بنيت أكثر، زاد «صداك» الذي يُرجّح تصويتك وتجاربك وتسعيرك.')}</P>
    </>),
  },
  {
    id: 'arabic', group: 'help', icon: Languages,
    title: { en: 'Arabic & RTL', ar: 'العربية وRTL' },
    keywords: 'arabic rtl fonts dialect direction',
    Body: (lang) => (<>
      <P>{L(lang,
        'Capable is built Arabic-first. When it detects Arabic, it sets dir="rtl", right-aligns text, mirrors layout, and uses Arabic-safe fonts (Cairo, Tajawal, Noto Kufi Arabic). You can mix Arabic and English in one prompt.',
        'كيبابل مبني بالعربية أولاً. عند اكتشاف العربية يضبط dir="rtl"، ويحاذي النص لليمين، ويعكس التخطيط، ويستخدم خطوطاً عربية مناسبة (Cairo، Tajawal، Noto Kufi Arabic). يمكنك المزج بين العربية والإنجليزية في تعليمة واحدة.')}</P>
      <H2>{L(lang, 'Dialect & region', 'اللهجة والمنطقة')}</H2>
      <P>{L(lang,
        'Name the target country for region-appropriate content and currency. Example: “اكتب المحتوى بالعربية السعودية الرسمية، واستخدم الريال”.',
        'اذكر الدولة المستهدفة للحصول على محتوى وعملة مناسبين للمنطقة. مثال: «اكتب المحتوى بالعربية السعودية الرسمية، واستخدم الريال».')}</P>
    </>),
  },
  {
    id: 'faq', group: 'help', icon: HelpCircle,
    title: { en: 'FAQ', ar: 'الأسئلة الشائعة' },
    keywords: 'faq questions code ownership privacy database',
    Body: (lang) => (<>
      <Faq q={L(lang, 'Do I need to know how to code?', 'هل أحتاج معرفة البرمجة؟')}>
        {L(lang, 'No. Capable is built for non-technical founders — describe what you want and the AI builds it. The code editor is there if you want it, but it’s optional.',
          'لا. كيبابل مصمّم للمؤسّسين غير التقنيين — صِف ما تريد ويبنيه الذكاء. محرّر الأكواد متاح إن أردته، لكنه اختياري.')}
      </Faq>
      <Faq q={L(lang, 'Who owns the code I generate?', 'من يملك الكود الذي أُنشئه؟')}>
        {L(lang, 'You do. All generated code belongs to you and you can use it anywhere.',
          'أنت. كل كود يُولَّد ملكك ويمكنك استخدامه في أي مكان.')}
      </Faq>
      <Faq q={L(lang, 'Is my project data private?', 'هل بيانات مشروعي خاصة؟')}>
        {L(lang, 'Yes. Projects are private by default. Publishing to the Marketplace is an explicit opt-in.',
          'نعم. المشاريع خاصة افتراضياً. النشر في المتجر إجراء اختياري صريح.')}
      </Faq>
      <Faq q={L(lang, 'Can I build a real production site?', 'هل أبني موقع إنتاج حقيقي؟')}>
        {L(lang, 'Capable is optimized for MVP validation. Sites are fully functional; for heavy production systems (databases, auth, custom infra) export the code and build on a proper backend.',
          'كيبابل مُحسّن للتحقّق من النماذج الأولية. المواقع تعمل بالكامل؛ ولأنظمة الإنتاج الثقيلة (قواعد بيانات، مصادقة، بنية مخصصة) صدّر الكود وابنِ على خادم مناسب.')}
      </Faq>
    </>),
  },
  {
    id: 'troubleshoot', group: 'help', icon: Server,
    title: { en: 'Troubleshooting', ar: 'حل المشاكل' },
    keywords: 'troubleshoot blank preview dns sign in 401',
    Body: (lang) => (<>
      <Faq q={L(lang, 'The AI replies in English though I wrote Arabic', 'الذكاء يردّ بالإنجليزية رغم كتابتي بالعربية')}>
        {L(lang, 'Start the prompt with Arabic text. If it’s mixed, lead with the Arabic description and put English technical terms in parentheses.',
          'ابدأ التعليمة بنصّ عربي. إذا كانت مختلطة، ابدأ بالوصف العربي وضع المصطلحات التقنية الإنجليزية بين قوسين.')}
      </Faq>
      <Faq q={L(lang, 'The preview is blank', 'المعاينة فارغة')}>
        {L(lang, 'The generation likely returned an error — check the chat for a message and try a simpler prompt or regenerate. Use code view to clear any malformed HTML.',
          'غالباً أرجع التوليد خطأً — راجع المحادثة لرسالة وجرّب تعليمة أبسط أو أعد التوليد. استخدم عرض الكود لإصلاح أي HTML تالف.')}
      </Faq>
      <Faq q={L(lang, 'I was signed out / actions stopped working', 'تم تسجيل خروجي / توقّفت الإجراءات')}>
        {L(lang, 'Your session token may have expired. Sign in again to get a fresh session.',
          'قد تكون جلستك قد انتهت. سجّل الدخول مجدداً للحصول على جلسة جديدة.')}
      </Faq>
      <Faq q={L(lang, 'Custom domain still “not verified”', 'النطاق المخصص ما زال «غير مُتحقّق»')}>
        {L(lang, 'Confirm the TXT and CNAME records are saved exactly, with no conflicting records, and Cloudflare proxy is off (DNS-only) during verification.',
          'تأكّد من حفظ سجلّي TXT وCNAME تماماً، دون سجلّات متعارضة، وأن وكيل Cloudflare مُطفأ (DNS فقط) أثناء التحقّق.')}
      </Faq>
    </>),
  },
];

export default function DocsPage() {
  const { lang, isRTL } = useLang();
  const [active, setActive] = useState('intro');
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return SECTIONS.filter(s =>
      s.title.en.toLowerCase().includes(q) || s.title.ar.includes(query.trim()) ||
      (s.keywords || '').includes(q)
    );
  }, [query]);

  const current = SECTIONS.find(s => s.id === active) || SECTIONS[0];
  const grouped = Object.keys(GROUPS).map(g => ({ g, items: SECTIONS.filter(s => s.group === g) }));

  return (
    <div className="min-h-screen bg-white text-capable-text dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
        <Logo to="/" size="sm" wordClassName="hidden sm:block" />
        <span className="text-gray-300 dark:text-slate-700 hidden sm:inline">/</span>
        <span className="text-sm text-capable-muted dark:text-slate-400 hidden sm:inline">{L(lang, 'Guide', 'الدليل')}</span>
        <div className="relative flex-1 max-w-sm ms-auto">
          <Search size={15} className="absolute top-1/2 -translate-y-1/2 start-3 text-capable-muted dark:text-slate-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={L(lang, 'Search the guide…', 'ابحث في الدليل…')}
            className="w-full h-9 rounded-lg ps-9 pe-3 text-sm bg-capable-surface dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-capable-text dark:text-white placeholder-capable-muted dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <ThemeToggle />
        <LangToggle />
      </header>

      <div className="flex flex-1 max-w-6xl w-full mx-auto">
        {/* Sidebar */}
        <aside className="w-60 shrink-0 hidden md:block border-e border-gray-200 dark:border-slate-800 py-5 overflow-y-auto">
          {grouped.map(({ g, items }) => (
            <div key={g} className="mb-4">
              <div className="px-5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-capable-muted dark:text-slate-500">{GROUPS[g][lang === 'ar' ? 'ar' : 'en']}</div>
              {items.map(s => {
                const Icon = s.icon;
                const on = s.id === active && !results;
                return (
                  <button
                    key={s.id}
                    onClick={() => { setActive(s.id); setQuery(''); }}
                    className={`w-full flex items-center gap-2.5 px-5 py-1.5 text-[13px] border-s-2 transition-colors text-start ${on
                      ? 'border-capable-navy dark:border-indigo-400 bg-indigo-50 dark:bg-slate-800/60 text-capable-navy dark:text-white font-semibold'
                      : 'border-transparent text-capable-text dark:text-slate-300 hover:bg-capable-surface dark:hover:bg-slate-800/40 hover:text-capable-navy dark:hover:text-white'}`}
                  >
                    <Icon size={15} className="opacity-70 shrink-0" />
                    {s.title[lang === 'ar' ? 'ar' : 'en']}
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 px-5 sm:px-8 py-8 overflow-y-auto">
          <Link to="/dashboard" className="md:hidden inline-flex items-center gap-1.5 text-sm text-capable-muted dark:text-slate-400 mb-4">
            <ArrowLeft size={15} className={isRTL ? 'rotate-180' : ''} /> {L(lang, 'Dashboard', 'لوحة التحكم')}
          </Link>

          {results ? (
            <div>
              <p className="text-xs text-capable-muted dark:text-slate-500 mb-3">
                {results.length} {L(lang, `result${results.length === 1 ? '' : 's'} for`, 'نتيجة لـ')} “{query}”
              </p>
              {results.length === 0 ? (
                <div className="text-center py-16 text-capable-muted dark:text-slate-500">
                  <Search size={28} className="mx-auto mb-2 opacity-30" />
                  {L(lang, 'No results.', 'لا نتائج.')}
                </div>
              ) : results.map(s => (
                <button key={s.id} onClick={() => { setActive(s.id); setQuery(''); }}
                  className="block w-full text-start rounded-xl border border-gray-200 dark:border-slate-700 p-4 mb-2 hover:border-capable-light dark:hover:border-indigo-500/50 hover:bg-capable-surface dark:hover:bg-slate-800/40 transition-colors">
                  <div className="text-sm font-semibold text-capable-navy dark:text-white">{s.title[lang === 'ar' ? 'ar' : 'en']}</div>
                  <div className="text-xs text-capable-muted dark:text-slate-500 mt-0.5">{GROUPS[s.group][lang === 'ar' ? 'ar' : 'en']}</div>
                </button>
              ))}
            </div>
          ) : (
            <article className="max-w-2xl">
              <div className="text-[10px] uppercase tracking-[2px] text-capable-light dark:text-indigo-400 font-semibold mb-2">{GROUPS[current.group][lang === 'ar' ? 'ar' : 'en']}</div>
              <h1 className="text-2xl font-bold text-capable-navy dark:text-white mb-6 pb-4 border-b border-gray-200 dark:border-slate-800">{current.title[lang === 'ar' ? 'ar' : 'en']}</h1>
              {current.Body(lang)}

              <div className="mt-10 pt-5 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between text-sm">
                <Link to="/builder" className="btn-primary text-sm py-2 px-4">{L(lang, 'Start building', 'ابدأ البناء')}</Link>
                <a href="mailto:support@capable.app" className="text-capable-muted dark:text-slate-400 hover:text-capable-navy dark:hover:text-white">
                  {L(lang, 'Still stuck? Contact support', 'ما زلت عالقاً؟ تواصل مع الدعم')}
                </a>
              </div>
            </article>
          )}
        </main>
      </div>
    </div>
  );
}
