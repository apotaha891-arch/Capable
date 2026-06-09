import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Sparkles, Send, RotateCcw, Download, Globe, Code2,
  Eye, ChevronRight, Wand2, Zap, Copy, Check, ArrowRight,
  Loader2, AlertCircle, X, Monitor, Tablet, Smartphone,
  MessageSquare, Layers
} from 'lucide-react';
import { useLang } from '../i18n/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import CapableLogo from '../components/CapableLogo.jsx';

// ─── System Prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Capable's AI builder — an expert web developer and designer embedded inside the Capable platform. Your ONLY job is to generate complete, beautiful, production-ready websites and web apps based on user descriptions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL OUTPUT FORMAT — NEVER DEVIATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Always respond with ONLY a valid JSON object. No preamble, no explanation, no markdown fences outside the JSON. The response must be directly parseable by JSON.parse().

{"message":"short Arabic message to user (2-3 sentences max)","code":"complete single-file HTML here","title":"project name in the user's language","type":"landing|store|restaurant|booking|portfolio|app|other"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CODE GENERATION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. SINGLE FILE: All HTML, CSS, and JavaScript in ONE complete index.html file. No external local files. CDN libraries allowed.

2. RTL FIRST: If user writes in Arabic OR describes Arabic-market business → use dir="rtl" lang="ar". Use Cairo font: https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap. If English → dir="ltr".

3. DESIGN QUALITY: Professional modern design matching the business type. Mobile-first responsive. Real content (NO Lorem Ipsum). Arabic content uses realistic Arabic names, places, prices in SAR/AED.

4. CAPABLE BRAND: Primary Navy #1F4788, Blue #4A7BC8, Green #10D981. Adapt to business type.

5. INTERACTIVITY: Working navigation, hover effects, mobile menu, form validation, smooth scroll.

6. SECTIONS BY TYPE:
   - Store: hero + products grid + categories + cart button + footer
   - Restaurant: hero + menu categories + items with prices + reservation + location
   - Booking: hero + services + calendar UI + booking form + confirmation
   - Portfolio: hero + about + skills + projects grid + contact
   - Launch: hero + problem/solution + features + pricing + FAQ + CTA
   - Clinic: hero + services + doctors + appointment form + hours
   - Real Estate: hero search + property cards + filters + contact
   - Education: hero + courses + instructor + pricing + enrollment

7. QUALITY: Complete HTML (html/head/body/closing tags), 200+ lines, no [INSERT TEXT] placeholders.

EDIT MODE: When user asks to modify existing code, return COMPLETE updated HTML with only the requested change. Confirm what changed in "message".

NEVER: return plain text, use markdown fences around entire response, return partial code, use Lorem Ipsum, return code under 200 lines.`;

// ─── Templates ─────────────────────────────────────────────────────────────────
const TEMPLATES = [
  { id: 'store',      emoji: '🛍️', labelAr: 'متجر',       labelEn: 'Store',
    promptAr: 'أنشئ متجراً إلكترونياً احترافياً باللغة العربية مع منتجات وأسعار بالريال وزر واتساب',
    promptEn: 'Create a professional e-commerce store with product grid, prices, and WhatsApp order button' },
  { id: 'restaurant', emoji: '🍽️', labelAr: 'مطعم',       labelEn: 'Restaurant',
    promptAr: 'أنشئ موقع مطعم سعودي فاخر باللغة العربية مع قائمة طعام وأسعار وحجز وتوصيل',
    promptEn: 'Create a restaurant website with menu, prices, reservation, and delivery options' },
  { id: 'booking',    emoji: '📅', labelAr: 'حجوزات',      labelEn: 'Booking',
    promptAr: 'أنشئ تطبيق حجز مواعيد احترافي باللغة العربية مع تقويم وخدمات وأسعار',
    promptEn: 'Create a professional appointment booking app with calendar and services list' },
  { id: 'portfolio',  emoji: '💼', labelAr: 'بورتفوليو',   labelEn: 'Portfolio',
    promptAr: 'أنشئ موقع بورتفوليو احترافي باللغة العربية مع أعمال ومهارات وتواصل',
    promptEn: 'Create a professional portfolio with projects, skills, and contact form' },
  { id: 'launch',     emoji: '🚀', labelAr: 'إطلاق منتج',  labelEn: 'Launch',
    promptAr: 'أنشئ landing page لإطلاق منتج باللغة العربية مع مميزات وأسعار وشهادات',
    promptEn: 'Create a high-conversion product launch page with features, pricing, testimonials' },
  { id: 'clinic',     emoji: '🏥', labelAr: 'عيادة',        labelEn: 'Clinic',
    promptAr: 'أنشئ موقع عيادة طبية باللغة العربية مع أطباء وخدمات وحجز مواعيد',
    promptEn: 'Create a medical clinic website with doctors, services, and appointment booking' },
];

// ─── Viewport sizes ─────────────────────────────────────────────────────────────
const VIEWPORTS = [
  { id: 'desktop',  icon: Monitor,    width: '100%' },
  { id: 'tablet',   icon: Tablet,     width: '768px' },
  { id: 'mobile',   icon: Smartphone, width: '390px' },
];

// ─── Build-time tips ─────────────────────────────────────────────────────────────
// Shown while the AI is generating so the wait is informative, not a dead spinner.
const BUILD_TIPS = [
  { ar: 'الذكاء الاصطناعي يكتب HTML و CSS و JavaScript كاملة لموقعك من الصفر.',
    en: 'The AI is writing complete HTML, CSS and JavaScript for your site from scratch.' },
  { ar: 'كلما كان وصفك أوضح وأكثر تحديداً، كانت النتيجة أدق.',
    en: 'The clearer and more specific your description, the better the result.' },
  { ar: 'يتم تصميم موقعك ليعمل تلقائياً على الجوال والكمبيوتر.',
    en: 'Your site is being designed to work on mobile and desktop automatically.' },
  { ar: 'المشاريع المعقّدة (متجر، حجوزات، تطبيق متعدد الميزات) تأخذ وقتاً أطول.',
    en: 'Complex projects (stores, booking, multi-feature apps) take longer to build.' },
  { ar: 'يمكنك بعد البناء طلب أي تعديل بالكتابة في المحادثة — مثل «غيّر اللون للأخضر».',
    en: 'After it builds, ask for any change in the chat — e.g. "make the color green".' },
  { ar: 'نُبقي كل شيء في ملف واحد ليكون موقعك سريعاً وسهل النشر.',
    en: 'Everything is kept in a single file so your site is fast and easy to publish.' },
];

// Short, friendly status lines shown in the chat while the agent works — so the
// wait feels like a teammate thinking out loud ("noodling", "forming") rather than
// a frozen spinner. Loosely tracks the real pipeline: draft → review → polish.
const BUILD_STATUS = [
  { ar: 'وكيل كيبابل يفكّر في تصميم موقعك…', en: 'Capable is sketching your layout…' },
  { ar: 'يكتب الكود ويبني الصفحات…',        en: 'Writing the code and building pages…' },
  { ar: 'يراجع الجودة ويصلح التفاصيل…',      en: 'Reviewing quality and fixing details…' },
  { ar: 'يضبط الألوان والمحتوى العربي…',     en: 'Tuning colors and content…' },
  { ar: 'يلمّع اللمسات الأخيرة…',           en: 'Polishing the final touches…' },
];

// Builder model tiers shown in the selector. Higher tiers cost more tokens but
// produce better output, so they carry a tighter limit (enforced server-side).
const TIER_META = [
  { id: 'capable1', name: 'Capable 1', ar: 'سريع واقتصادي', en: 'Fast & economical' },
  { id: 'capable2', name: 'Capable 2', ar: 'جودة أعلى ومراجعة أدق', en: 'Higher quality, deeper review' },
  { id: 'capable3', name: 'Capable 3', ar: 'أعلى جودة — استهلاك أكبر وحد أقل', en: 'Top quality — more usage, tighter limit' },
];

// Soft upsell whisper copy, keyed by the reason code the server returns. Nudges
// toward the stronger engines without nagging.
const UPSELL_COPY = {
  fallback: {
    ar: 'كان هذا الطلب صعباً على المحرّك الحالي. جرّب Capable 2 أو Capable 3 لنتيجة كاملة وأكثر تطوراً.',
    en: 'This was tricky for the current engine. Try Capable 2 or Capable 3 for a complete, more functional result.',
  },
  escalated: {
    ar: 'استخدمنا محرّكاً أقوى لإنجاز هذا. البدء على Capable 2 أو Capable 3 يعطي نتائج أكمل من المحاولة الأولى.',
    en: 'We used a stronger engine to get this right. Starting on Capable 2 or 3 gives more functional results in one pass.',
  },
  tip: {
    ar: 'نصيحة: Capable 2 و Capable 3 يستخدمان نماذج أقوى لمشاريع أكثر تعقيداً ووظائف أغنى.',
    en: 'Tip: Capable 2 and Capable 3 use stronger models for more complex, functional builds.',
  },
  tier_locked: {
    ar: 'محرّكات Capable 2 و Capable 3 متاحة في باقة Pro. تمت المتابعة بالمحرّك الأساسي — رقِّ إلى Pro لاستخدام النماذج الأقوى.',
    en: 'Capable 2 and Capable 3 are Pro features. We continued on the base engine — upgrade to Pro to build with the stronger models.',
  },
};

// Injected into the preview so clicks inside the generated demo don't navigate the
// iframe away (e.g. a placeholder href="/" would otherwise load the host app).
// External http(s) links open in a new tab; everything else is neutralized.
const PREVIEW_GUARD = `<base target="_blank"><script>(function(){
  document.addEventListener('click',function(e){
    var a=e.target&&e.target.closest&&e.target.closest('a');
    if(!a)return;
    var h=(a.getAttribute('href')||'').toLowerCase();
    if(h.indexOf('http://')!==0&&h.indexOf('https://')!==0){e.preventDefault();}
  },true);
  document.addEventListener('submit',function(e){e.preventDefault();},true);
})();</scr`+`ipt>`;

function buildPreviewDoc(code) {
  if (!code) return '';
  return /<head[^>]*>/i.test(code)
    ? code.replace(/<head[^>]*>/i, (m) => m + PREVIEW_GUARD)
    : PREVIEW_GUARD + code;
}

// ─── Main Component ──────────────────────────────────────────────────────────────
export default function BuilderPage() {
  const { lang, isRTL } = useLang();
  const { authFetch, user } = useAuth();
  const isPro = user?.plan === 'pro' || user?.plan === 'enterprise'; // gates Capable 2/3
  const navigate = useNavigate();
  const { id: projectId } = useParams(); // optional: /builder/:id for existing project

  // State
  const [prompt, setPrompt]               = useState('');
  const [messages, setMessages]           = useState([]);  // chat history for Claude
  const [chatLog, setChatLog]             = useState([]);  // UI display log
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating]   = useState(false);
  const [activeTab, setActiveTab]         = useState('preview'); // preview | code
  const [viewport, setViewport]           = useState('desktop');
  const [copied, setCopied]               = useState(false);
  const [error, setError]                 = useState(null);
  const [projectTitle, setProjectTitle]   = useState('');
  const [phase, setPhase]                 = useState('input'); // input | builder
  const [savedProjectId, setSavedProjectId] = useState(projectId || null);
  const [publishing, setPublishing]       = useState(false);
  const [elapsed, setElapsed]             = useState(0);   // seconds since build started
  const [tipIndex, setTipIndex]           = useState(0);
  const [tier, setTier]                   = useState('capable1'); // capable1 | capable2 | capable3
  const [upsell, setUpsell]               = useState(null);  // reason code for the engine whisper

  // Remix flow: arriving from a public preview's "Edit with Capable" badge
  // (/builder?from=<id>) clones that public project into the user's account and
  // opens the copy in the editor. Seed `remixing` from the URL so the very first
  // render shows the loading screen instead of a flash of the blank builder.
  const [remixing, setRemixing]           = useState(() => new URLSearchParams(window.location.search).has('from'));
  const [remixError, setRemixError]       = useState(false);

  const textareaRef  = useRef(null);
  const chatEndRef   = useRef(null);
  const iframeRef    = useRef(null);
  const remixStartedRef = useRef(false);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  // Clone-and-open when the URL carries ?from=<id> (the preview badge). The
  // /builder route is auth-gated, so `user` is guaranteed here; logged-out
  // viewers sign in first and return with the param intact. The ref guard stops
  // a double clone under StrictMode's double-invoked effects.
  useEffect(() => {
    const sourceId = new URLSearchParams(window.location.search).get('from');
    if (!sourceId || remixStartedRef.current) return;
    remixStartedRef.current = true;
    (async () => {
      try {
        const res = await authFetch(`/api/projects/${encodeURIComponent(sourceId)}/clone`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'clone failed');
        navigate(data.has_blueprint ? `/blueprint/${data.id}` : `/editor/${data.id}`, { replace: true });
      } catch {
        setRemixing(false);
        setRemixError(true);
      }
    })();
  }, [authFetch, navigate]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  }, [prompt]);

  // While generating, tick an elapsed-time counter and rotate the build tips so
  // the wait shows progress instead of a frozen spinner.
  useEffect(() => {
    if (!isGenerating) { setElapsed(0); return; }
    setElapsed(0);
    setTipIndex(0);
    const tick = setInterval(() => setElapsed(e => e + 1), 1000);
    const rotate = setInterval(() => setTipIndex(i => (i + 1) % BUILD_TIPS.length), 4500);
    return () => { clearInterval(tick); clearInterval(rotate); };
  }, [isGenerating]);

  // ── Core generation function ──────────────────────────────────────────────────
  const generate = useCallback(async (userMessage) => {
    if (!userMessage.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setUpsell(null);
    setPhase('builder');

    const userMsg = { role: 'user', content: userMessage };
    const newHistory = [...messages, userMsg];

    // Add to chat log
    setChatLog(prev => [...prev, { role: 'user', text: userMessage }]);

    try {
      const res = await authFetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: SYSTEM_PROMPT,
          messages: newHistory,
          projectId: projectId || savedProjectId,
          tier,
        }),
      });

      if (res.status === 402) {
        const d = await res.json().catch(() => ({}));
        if (d.error === 'tier_limit_reached') {
          setError(isRTL
            ? `انتهى حد موديل ${d.tier} (الأعلى جودة يستهلك أكثر). تم الرجوع للموديل الأقل — أو رقِّ باقتك للاستمرار عليه.`
            : `${d.tier} limit reached (higher quality costs more). Switched you to the cheaper model — or upgrade to keep using it.`);
          if (d.can_downgrade) setTier('capable1');
        } else {
          setError(isRTL ? 'انتهت أرصدتك. يرجى الترقية للاستمرار.' : 'Credits exhausted. Please upgrade to continue.');
        }
        setIsGenerating(false);
        return;
      }

      const data = await res.json();

      if (!res.ok || data.error) {
        let msg;
        if (data.error === 'output_truncated') {
          msg = isRTL
            ? 'الموقع أصبح كبيراً جداً فتوقّف قبل اكتماله. جرّب وصفاً أبسط أو قسّمه إلى ميزات أقل.'
            : 'The site grew too large and was cut off before finishing. Try a simpler description or fewer features.';
        } else if (data.error === 'ai_unavailable') {
          msg = isRTL ? 'خدمة الذكاء الاصطناعي غير مُهيأة على الخادم.' : 'The AI service is not configured on the server.';
        } else {
          msg = isRTL ? 'حدث خطأ. حاول مجدداً.' : 'An error occurred. Please try again.';
        }
        setError(msg);
        setIsGenerating(false);
        return;
      }

      // Update code
      if (data.code) {
        setGeneratedCode(data.code);
        setActiveTab('preview');
      }
      if (data.title) setProjectTitle(data.title);

      // Save assistant turn in history (summary, not full code, to save tokens)
      const assistantContent = JSON.stringify({ message: data.message, code: data.code });
      setMessages([...newHistory, { role: 'assistant', content: assistantContent }]);

      // Add to chat log
      setChatLog(prev => [...prev, { role: 'ai', text: data.message || (isRTL ? 'تم البناء بنجاح! ✨' : 'Built successfully! ✨') }]);

      // Surface the engine whisper (only when the server flags it as relevant).
      setUpsell(UPSELL_COPY[data.upsell] ? data.upsell : null);

    } catch (err) {
      setError(isRTL ? 'تعذّر الاتصال بالخادم. تحقق من اتصالك.' : 'Could not reach server. Check your connection.');
    } finally {
      setIsGenerating(false);
      setPrompt('');
    }
  }, [messages, isGenerating, authFetch, projectId, savedProjectId, isRTL, tier]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleSend = () => generate(prompt);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTemplate = (tpl) => {
    const p = isRTL ? tpl.promptAr : tpl.promptEn;
    setPrompt(p);
    textareaRef.current?.focus();
  };

  const handleHeroTemplate = (tpl) => {
    const p = isRTL ? tpl.promptAr : tpl.promptEn;
    generate(p);
  };

  const handleCopyCode = async () => {
    if (!generatedCode) return;
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    if (!generatedCode) return;
    const blob = new Blob([generatedCode], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${projectTitle || 'project'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setMessages([]);
    setChatLog([]);
    setGeneratedCode('');
    setPrompt('');
    setError(null);
    setPhase('input');
    setProjectTitle('');
    setSavedProjectId(projectId || null);
    setUpsell(null);
  };

  // Persist the generated site as a project (if not already one), then open its
  // control panel where the user can actually publish / pick a domain.
  const handlePublish = async () => {
    if (!generatedCode || publishing) return;
    let id = projectId || savedProjectId;
    if (!id) {
      setPublishing(true);
      try {
        const res = await authFetch('/api/projects', {
          method: 'POST',
          body: JSON.stringify({
            name: projectTitle || (isRTL ? 'مشروع بدون عنوان' : 'Untitled project'),
            code: generatedCode,
          }),
        });
        if (!res.ok) throw new Error('create failed');
        const proj = await res.json();
        id = proj.id;
        setSavedProjectId(id);
      } catch {
        setError(isRTL ? 'تعذّر حفظ المشروع. حاول مجدداً.' : 'Could not save the project. Try again.');
        setPublishing(false);
        return;
      }
      setPublishing(false);
    }
    navigate(`/project/${id}`);
  };

  const vp = VIEWPORTS.find(v => v.id === viewport);
  const previewDoc = useMemo(() => buildPreviewDoc(generatedCode), [generatedCode]);

  // ── REMIX PHASE ───────────────────────────────────────────────────────────────
  // Cloning a previewed project into the user's account, then redirecting to the
  // editor. Shown instead of the blank builder while the clone is in flight.
  if (remixing) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">{isRTL ? 'جارٍ تجهيز نسختك للتعديل…' : 'Preparing your copy to edit…'}</p>
      </div>
    );
  }

  if (remixError) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4 px-6 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <AlertCircle className="text-amber-400" size={28} />
        <p className="text-slate-300 max-w-sm">{isRTL ? 'تعذّر فتح هذا المشروع للتعديل. يمكنك البدء بمشروع جديد بدلاً من ذلك.' : "Couldn't open that project to edit. You can start a new one instead."}</p>
        <button
          onClick={() => setRemixError(false)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          {isRTL ? 'ابدأ مشروعاً جديداً' : 'Start a new project'}
        </button>
      </div>
    );
  }

  // ── INPUT PHASE ───────────────────────────────────────────────────────────────
  if (phase === 'input') {
    return (
      <div
        className="min-h-screen bg-slate-950 text-white flex flex-col"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white group-hover:bg-indigo-500 transition-colors">
              <CapableLogo size={18} strokeWidth={6.5} />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              Capable
            </span>
          </Link>
          <Link
            to="/dashboard"
            className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            {isRTL ? 'لوحة التحكم' : 'Dashboard'}
            {isRTL ? <ArrowRight size={14} className="rotate-180" /> : <ArrowRight size={14} />}
          </Link>
        </nav>

        {/* Hero Input */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-3xl mx-auto w-full">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-8 uppercase tracking-wider">
            <Wand2 size={12} />
            {isRTL ? 'منشئ المواقع الذكي' : 'AI Website Builder'}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-4 leading-tight">
            {isRTL
              ? <>ماذا تريد أن <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">تبني</span> اليوم؟</>
              : <>What do you want to <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">build</span> today?</>
            }
          </h1>
          <p className="text-slate-400 text-center mb-10 text-base leading-relaxed max-w-lg">
            {isRTL
              ? 'صف مشروعك بأي لغة وسيبنيه الذكاء الاصطناعي في ثوانٍ — موقع كامل جاهز للنشر.'
              : 'Describe your project in any language and AI builds it in seconds — a complete site ready to publish.'
            }
          </p>

          {/* Prompt box */}
          <div className="w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/10 focus-within:border-indigo-500/60 transition-all duration-300 mb-6">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKey}
              placeholder={isRTL
                ? 'مثال: أريد موقع مطعم سعودي فاخر مع قائمة طعام وحجز...'
                : 'e.g. I want a luxury restaurant website with menu, reservation and delivery...'
              }
              className="w-full bg-transparent px-5 pt-5 pb-3 text-white text-base leading-relaxed resize-none outline-none placeholder:text-slate-600 min-h-[100px]"
              dir={isRTL ? 'rtl' : 'ltr'}
              rows={3}
            />
            <div className="flex items-center justify-between px-4 pb-4 pt-1">
              <span className="text-xs text-slate-600">
                {isRTL ? 'Shift+Enter للسطر الجديد' : 'Shift+Enter for new line'}
              </span>
              <button
                onClick={handleSend}
                disabled={!prompt.trim()}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/30"
              >
                {isRTL ? 'ابنِ الآن' : 'Build Now'}
                <Sparkles size={15} />
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 w-full mb-6">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-600 whitespace-nowrap">
              {isRTL ? 'أو اختر قالباً جاهزاً' : 'or choose a template'}
            </span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Template chips */}
          <div className="flex flex-wrap gap-3 justify-center">
            {TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => handleHeroTemplate(tpl)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:border-indigo-500/60 hover:bg-indigo-500/10 text-slate-300 hover:text-white text-sm font-medium transition-all hover:-translate-y-0.5"
              >
                <span>{tpl.emoji}</span>
                <span>{isRTL ? tpl.labelAr : tpl.labelEn}</span>
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // ── BUILDER PHASE ─────────────────────────────────────────────────────────────
  return (
    <div
      className="h-screen bg-slate-950 text-white flex flex-col overflow-hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/80 backdrop-blur shrink-0 gap-3">
        {/* Left: logo + title */}
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <CapableLogo size={16} strokeWidth={6.5} />
            </div>
            <span className="font-bold text-sm bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent hidden sm:block">
              Capable
            </span>
          </Link>
          {projectTitle && (
            <>
              <ChevronRight size={14} className="text-slate-600 shrink-0" />
              <span className="text-sm text-slate-300 truncate max-w-[160px]">{projectTitle}</span>
            </>
          )}
        </div>

        {/* Center: viewport toggles */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 shrink-0">
          {VIEWPORTS.map(v => {
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                onClick={() => setViewport(v.id)}
                className={`p-1.5 rounded-md transition-all ${viewport === v.id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Icon size={14} />
              </button>
            );
          })}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReset}
            title={isRTL ? 'بداية جديدة' : 'Start over'}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <RotateCcw size={15} />
          </button>
          {generatedCode && (
            <>
              <button
                onClick={handleDownload}
                title={isRTL ? 'تحميل' : 'Download'}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <Download size={15} />
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="hidden sm:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              >
                {publishing ? <Loader2 size={13} className="animate-spin" /> : <Globe size={13} />}
                {publishing ? (isRTL ? 'جارٍ الحفظ...' : 'Saving...') : (isRTL ? 'نشر' : 'Publish')}
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left panel: Chat ── */}
        <aside className="w-72 xl:w-80 border-e border-slate-800 bg-slate-900/50 flex flex-col shrink-0">

          {/* Panel tabs */}
          <div className="flex border-b border-slate-800 shrink-0">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-indigo-400 border-b-2 border-indigo-500">
              <MessageSquare size={13} />
              {isRTL ? 'المحادثة' : 'Chat'}
            </button>
            <button
              onClick={() => {/* future: templates tab */}}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors border-b-2 border-transparent"
            >
              <Layers size={13} />
              {isRTL ? 'القوالب' : 'Templates'}
            </button>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
            {chatLog.length === 0 && (
              <div className="text-center text-slate-600 text-xs mt-8 leading-relaxed px-4">
                {isRTL
                  ? 'ابدأ بوصف مشروعك أو اختر قالباً من الأسفل'
                  : 'Start by describing your project or pick a template below'
                }
              </div>
            )}
            {chatLog.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold
                  ${msg.role === 'ai'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {msg.role === 'ai' ? 'C' : (user?.name?.[0]?.toUpperCase() || 'U')}
                </div>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed
                  ${msg.role === 'ai'
                    ? 'bg-slate-800 text-slate-200 rounded-ss-none'
                    : 'bg-indigo-600/80 text-white rounded-se-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                  <Loader2 size={12} className="animate-spin text-white" />
                </div>
                <div className="bg-slate-800 rounded-xl rounded-ss-none px-3 py-2 max-w-[85%]">
                  <p key={tipIndex} className="text-xs text-slate-300 leading-relaxed animate-in fade-in mb-1.5">
                    {isRTL ? BUILD_STATUS[tipIndex % BUILD_STATUS.length].ar : BUILD_STATUS[tipIndex % BUILD_STATUS.length].en}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="mx-3 mb-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2">
              <AlertCircle size={13} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300 leading-relaxed">{error}</p>
              <button onClick={() => setError(null)} className="ms-auto text-red-400 hover:text-red-300">
                <X size={12} />
              </button>
            </div>
          )}

          {/* Engine upsell whisper — gentle, dismissible, with a one-tap switch. */}
          {upsell && !isGenerating && (
            <div className="mx-3 mb-2 p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-start gap-2">
              <Zap size={13} className="text-indigo-300 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[11px] text-indigo-200 leading-relaxed">
                  {isRTL ? UPSELL_COPY[upsell].ar : UPSELL_COPY[upsell].en}
                </p>
                {upsell === 'tier_locked' ? (
                  <Link
                    to="/influence"
                    className="mt-1.5 inline-block text-[11px] font-semibold text-indigo-300 hover:text-indigo-200 underline underline-offset-2"
                  >
                    {isRTL ? 'الترقية إلى Pro' : 'Upgrade to Pro'}
                  </Link>
                ) : isPro && tier !== 'capable3' && (
                  <button
                    onClick={() => { setTier(upsell === 'fallback' ? 'capable3' : 'capable2'); setUpsell(null); }}
                    className="mt-1.5 text-[11px] font-semibold text-indigo-300 hover:text-indigo-200 underline underline-offset-2"
                  >
                    {isRTL
                      ? `التبديل إلى ${upsell === 'fallback' ? 'Capable 3' : 'Capable 2'}`
                      : `Switch to ${upsell === 'fallback' ? 'Capable 3' : 'Capable 2'}`}
                  </button>
                )}
              </div>
              <button onClick={() => setUpsell(null)} className="ms-auto text-indigo-300/70 hover:text-indigo-200">
                <X size={12} />
              </button>
            </div>
          )}

          {/* Templates quick-pick */}
          <div className="border-t border-slate-800 p-3 shrink-0">
            <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2 font-semibold">
              {isRTL ? 'قوالب سريعة' : 'Quick templates'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => handleTemplate(tpl)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-700 bg-slate-800/60 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-slate-400 hover:text-white text-[11px] transition-all"
                >
                  <span>{tpl.emoji}</span>
                  <span>{isRTL ? tpl.labelAr : tpl.labelEn}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-slate-800 p-3 shrink-0">
            {/* Model tier selector — all tiers available; higher ones cost more. */}
            <div className="flex items-center gap-1 mb-2">
              {TIER_META.map(tm => {
                const locked = (tm.id === 'capable2' || tm.id === 'capable3') && !isPro;
                return (
                  <button
                    key={tm.id}
                    type="button"
                    onClick={() => locked ? setUpsell('tier_locked') : setTier(tm.id)}
                    title={locked ? (isRTL ? 'متاح في باقة Pro' : 'Pro feature') : (isRTL ? tm.ar : tm.en)}
                    className={`flex-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all inline-flex items-center justify-center gap-1
                      ${tier === tm.id
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : locked
                          ? 'bg-slate-800/40 border-slate-800 text-slate-500 hover:text-slate-300'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white hover:border-indigo-500/40'}`}
                  >
                    {tm.name}
                    {locked && <span aria-hidden>🔒</span>}
                  </button>
                );
              })}
            </div>
            <p className={`text-[10px] mb-2 leading-relaxed ${tier === 'capable3' ? 'text-amber-400' : 'text-slate-500'}`}>
              {tier === 'capable3' && '⚡ '}
              {isRTL ? TIER_META.find(t => t.id === tier).ar : TIER_META.find(t => t.id === tier).en}
            </p>
            <div className="bg-slate-800 border border-slate-700 rounded-xl focus-within:border-indigo-500/60 transition-all">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={handleKey}
                placeholder={isRTL ? 'عدّل أو أضف...' : 'Edit or add...'}
                className="w-full bg-transparent px-3 pt-3 pb-1 text-white text-xs leading-relaxed resize-none outline-none placeholder:text-slate-600 max-h-[100px]"
                dir={isRTL ? 'rtl' : 'ltr'}
                rows={2}
              />
              <div className="flex justify-end px-2 pb-2">
                <button
                  onClick={handleSend}
                  disabled={!prompt.trim() || isGenerating}
                  className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Right panel: Preview / Code ── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">

          {/* Preview header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 shrink-0 bg-slate-900/40">
            <div className="flex items-center gap-1 bg-slate-800/80 rounded-lg p-0.5">
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all
                  ${activeTab === 'preview' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Eye size={12} /> {isRTL ? 'معاينة' : 'Preview'}
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all
                  ${activeTab === 'code' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Code2 size={12} /> {isRTL ? 'الكود' : 'Code'}
              </button>
            </div>

            {generatedCode && activeTab === 'code' && (
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                {copied
                  ? <><Check size={12} className="text-emerald-400" /> {isRTL ? 'تم النسخ' : 'Copied'}</>
                  : <><Copy size={12} /> {isRTL ? 'نسخ' : 'Copy'}</>
                }
              </button>
            )}
          </div>

          {/* Preview area */}
          <div className="flex-1 overflow-hidden flex items-center justify-center bg-slate-950 p-4">
            {!generatedCode && !isGenerating ? (
              // Empty state
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-5">
                  <Wand2 size={32} className="text-indigo-400/60" />
                </div>
                <p className="text-slate-500 text-sm">
                  {isRTL ? 'سيظهر موقعك هنا بعد البناء' : 'Your site will appear here after building'}
                </p>
              </div>
            ) : isGenerating && !generatedCode ? (
              // First load
              <div className="text-center max-w-sm mx-auto px-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-5">
                  <Loader2 size={28} className="text-indigo-400 animate-spin" />
                </div>
                <p key={tipIndex} className="text-indigo-300 text-sm font-medium mb-1 animate-in fade-in">
                  {isRTL ? BUILD_STATUS[tipIndex % BUILD_STATUS.length].ar : BUILD_STATUS[tipIndex % BUILD_STATUS.length].en}
                </p>
                <p className="text-slate-500 text-xs mb-5">
                  <span dir="ltr">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</span>
                  {' — '}
                  {isRTL
                    ? 'البناء مستمر — المشاريع المتقدمة قد تستغرق عدة دقائق'
                    : 'still building — advanced projects can take a few minutes'}
                </p>
                <div className="flex items-start gap-2 text-start bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 min-h-[60px]">
                  <Wand2 size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                  <p key={tipIndex} className="text-slate-400 text-xs leading-relaxed animate-in fade-in">
                    {isRTL ? BUILD_TIPS[tipIndex].ar : BUILD_TIPS[tipIndex].en}
                  </p>
                </div>
              </div>
            ) : activeTab === 'preview' ? (
              // iframe preview with viewport
              <div
                className="h-full transition-all duration-300 rounded-xl overflow-hidden shadow-2xl shadow-black/50 bg-white"
                style={{ width: vp.width, maxWidth: '100%' }}
              >
                <iframe
                  ref={iframeRef}
                  srcDoc={previewDoc}
                  className="w-full h-full border-0"
                  title="preview"
                  sandbox="allow-scripts allow-popups"
                />
              </div>
            ) : (
              // Code view
              <div className="w-full h-full overflow-auto rounded-xl bg-slate-900 border border-slate-800 p-5">
                <pre className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap break-all">
                  {generatedCode}
                </pre>
              </div>
            )}
          </div>

          {/* Status bar */}
          <div className="flex items-center gap-3 px-4 py-2 border-t border-slate-800 bg-slate-900/40 text-xs text-slate-600 shrink-0">
            <div className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-amber-500 animate-pulse' : generatedCode ? 'bg-emerald-500' : 'bg-slate-600'}`} />
            <span>
              {isGenerating
                ? (isRTL ? 'جاري البناء...' : 'Building...')
                : generatedCode
                  ? (isRTL ? `جاهز — ${generatedCode.length.toLocaleString()} حرف` : `Ready — ${generatedCode.length.toLocaleString()} chars`)
                  : (isRTL ? 'في انتظار وصفك' : 'Waiting for your description')
              }
            </span>
            {projectTitle && (
              <span className="ms-auto text-slate-600 truncate max-w-[200px]">
                {projectTitle}
              </span>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
