import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, ArrowRight, Eye, Rocket, Target,
  AlertTriangle, CheckCircle2, X, Clock, TrendingDown,
  TrendingUp, MessageSquare, Code2, Wand2, Share2, Globe,
  Check, Users, Store, Trophy,
} from 'lucide-react';
import { useLang } from '../i18n/LangContext.jsx';
import LangToggle from '../components/LangToggle.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import Logo from '../components/Logo.jsx';
import { API_BASE as API } from '../utils/api.js';

// Users who ask for reduced motion get content revealed immediately, no animation.
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// One IntersectionObserver drives every Reveal on the page rather than allocating
// a fresh observer per element. Each observed node maps to its reveal callback.
const revealCallbacks = new WeakMap();
let sharedObserver = null;

function getRevealObserver() {
  if (sharedObserver) return sharedObserver;
  sharedObserver = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const cb = revealCallbacks.get(entry.target);
        if (cb) cb();
        revealCallbacks.delete(entry.target);
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.15 }
  );
  return sharedObserver;
}

function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(prefersReducedMotion);
  useEffect(() => {
    if (prefersReducedMotion) return;
    const el = ref.current;
    if (!el) return;
    const observer = getRevealObserver();
    revealCallbacks.set(el, () => setShown(true));
    observer.observe(el);
    return () => {
      revealCallbacks.delete(el);
      observer.unobserve(el);
    };
  }, []);
  return [ref, shown];
}

function Reveal({ children, delay = 0, className = '' }) {
  const [ref, shown] = useReveal();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-500 ease-out ${
        shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children, tone = 'navy' }) {
  const tones = {
    navy: 'border-capable-navy/20 bg-capable-navy/5 text-capable-navy dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-300',
    success: 'border-capable-success/30 bg-capable-success/10 text-emerald-700 dark:text-emerald-300',
    error: 'border-capable-error/30 bg-capable-error/10 text-red-700 dark:text-red-300',
  };
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider ${tones[tone]}`}>
      {children}
    </span>
  );
}

function PricingSection({ t, isRTL }) {
  const freeFeatures = isRTL ? [
    'أرصدة تصميم ذكي للبدء',
    'نشر مجاني مع رابط قابل للمشاركة',
    'وصول كامل لمعرض القوالب',
    'استنساخ أي قالب مجاني',
    'تعديل نصوص وألوان غير محدود',
  ] : [
    'AI Design Credits to get started',
    'Free publishing with shareable link',
    'Full access to template gallery',
    'Clone any free template',
    'Unlimited text & color edits',
  ];

  const influenceFeatures = isRTL ? [
    'أرصدة تصميم ذكي أكثر بكثير',
    'نطاق مخصص واحد مشمول',
    'وصول مبكر للميزات الجديدة',
    'صوت وتأثير في خارطة الطريق',
    'كل ميزات الخطة المجانية',
  ] : [
    'Much more AI Design Credits',
    'One custom domain included',
    'Early access to new features',
    'A real say in the roadmap',
    'Everything in Free',
  ];

  const proFeatures = isRTL ? [
    'أرصدة تصميم ذكي بكميات أكبر',
    'نشر بنقرة واحدة + SSL مجاني',
    'نطاقات مخصصة بلا حدود وبلا علامة',
    'أولوية في المعالجة والدعم',
    'كل ميزات باقة التأثير',
  ] : [
    '4× more AI Design Credits',
    'One-click publishing + free SSL',
    'Unlimited unbranded custom domains',
    'Priority processing & support',
    'Everything in Influence',
  ];

  const consultFeatures = isRTL ? [
    'مهندس كيبل متخصص مخصص لك',
    'تكاملات API مخصصة',
    'منطق دفع وتسعير معقد',
    'ميزات تصميم متقدمة',
    'تسليم في 1–3 أيام عمل',
  ] : [
    'Dedicated Capable engineer',
    'Custom API integrations',
    'Complex payment & pricing logic',
    'Advanced design features',
    'Delivered in 1–3 business days',
  ];

  return (
    <section className="relative z-10 bg-capable-surface dark:bg-transparent border-b border-gray-100 dark:border-slate-800/60">
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-20 md:py-24">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <Reveal><h2 className="mb-3">{t('pricingTitle')}</h2></Reveal>
          <Reveal delay={80}>
            <p className="text-capable-muted dark:text-slate-400 text-base md:text-lg">{t('pricingSubtitle')}</p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Free */}
          <Reveal>
            <div className="brand-card p-8 h-full flex flex-col">
              <div className="mb-6">
                <div className="text-sm font-semibold text-capable-muted dark:text-slate-400 uppercase tracking-wider mb-2">{t('planFreeTitle')}</div>
                <div className="text-4xl font-extrabold text-capable-navy dark:text-white mb-1">{t('planFreePrice')}</div>
                <p className="text-sm text-capable-muted dark:text-slate-500">{t('planFreeDesc')}</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {freeFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-capable-text dark:text-slate-300">
                    <Check size={15} className="text-capable-success mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/dashboard" className="w-full bg-capable-surface dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-capable-navy dark:text-white py-3 rounded-brand text-sm font-semibold text-center transition-colors border border-gray-200 dark:border-slate-700">
                {t('planFreeBadge')}
              </Link>
            </div>
          </Reveal>

          {/* Influence — highlighted */}
          <Reveal delay={100}>
            <div className="relative rounded-brand p-8 h-full flex flex-col bg-capable-navy dark:bg-gradient-to-b dark:from-indigo-900/60 dark:to-slate-900 text-white shadow-brand-lg dark:shadow-2xl dark:shadow-indigo-500/20 dark:border dark:border-indigo-500/50">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-capable-light dark:bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  {isRTL ? 'الأكثر شيوعاً' : 'Most Popular'}
                </span>
              </div>
              <div className="mb-6">
                <div className="text-sm font-semibold text-white/70 dark:text-indigo-300 uppercase tracking-wider mb-2">{t('planInfluenceTitle')}</div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-extrabold text-white">{t('planInfluencePrice')}</span>
                  <span className="text-white/70 text-sm mb-1">{t('planInfluencePer')}</span>
                </div>
                <p className="text-sm text-white/70">{t('planInfluenceDesc')}</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {influenceFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/90">
                    <Check size={15} className="text-capable-success mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/influence" className="w-full bg-white text-capable-navy dark:bg-indigo-600 dark:text-white hover:bg-capable-surface dark:hover:bg-indigo-500 py-3 rounded-brand text-sm font-bold text-center transition-all">
                {t('planInfluenceBadge')}
              </Link>
            </div>
          </Reveal>

          {/* Pro */}
          <Reveal delay={200}>
            <div className="brand-card p-8 h-full flex flex-col">
              <div className="mb-6">
                <div className="text-sm font-semibold text-capable-muted dark:text-slate-400 uppercase tracking-wider mb-2">{t('planProTitle')}</div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-extrabold text-capable-navy dark:text-white">{t('planProPrice')}</span>
                  <span className="text-capable-muted dark:text-slate-500 text-sm mb-1">{t('planProPer')}</span>
                </div>
                <p className="text-sm text-capable-muted dark:text-slate-500">{t('planProDesc')}</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {proFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-capable-text dark:text-slate-300">
                    <Check size={15} className="text-capable-success mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/influence" className="w-full bg-capable-navy dark:bg-slate-800 hover:bg-capable-medium dark:hover:bg-slate-700 text-white py-3 rounded-brand text-sm font-bold text-center transition-colors">
                {t('planProBadge')}
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Expert / Consulting — band */}
        <Reveal delay={120}>
          <div className="mt-6 brand-card p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-brand bg-capable-navy/10 dark:bg-purple-500/20 text-capable-navy dark:text-purple-300 flex items-center justify-center shrink-0">
                <Users size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-capable-navy dark:text-white">{t('planConsultTitle')} · {t('planConsultPrice')}</div>
                <p className="text-sm text-capable-muted dark:text-slate-400">{t('planConsultDesc')}</p>
              </div>
            </div>
            <a href="mailto:hello@capable.app?subject=Expert%20Help%20Request" className="shrink-0 bg-capable-navy/90 dark:bg-purple-700 hover:bg-capable-navy dark:hover:bg-purple-600 text-white py-2.5 px-5 rounded-brand text-sm font-semibold text-center transition-colors">
              {t('planConsultBadge')}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const { t, isRTL, lang } = useLang();
  const [apiTemplates, setApiTemplates] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/projects/explore`)
      .then(r => (r.ok ? r.json() : []))
      .then(list => setApiTemplates(Array.isArray(list) ? list : []))
      .catch(() => setApiTemplates([]));
  }, []);

  // Real published projects (featured first from the API), top 6.
  const templates = apiTemplates.slice(0, 6).map(p => ({
    id: `db-${p.id}`,
    nameEn: p.name_en || p.name,
    nameAr: p.name_ar || (/[؀-ۿ]/.test(p.name || '') ? p.name : ''),
    description: p.description,
    author: p.author,
    image: /\/\/localhost|:5000\//.test(p.thumbnail_url || '') ? null : p.thumbnail_url,
    price: p.price || 0,
    likes: p.likes || 0,
    previewUrl: `${API}/api/projects/preview/${p.id}`,
  }));

  const ArrowIcon = isRTL ? (
    <ArrowRight size={18} className="rotate-180" />
  ) : (
    <ArrowRight size={18} />
  );

  return (
    <div className="min-h-screen bg-white text-capable-text dark:bg-slate-950 dark:text-slate-100 relative">
      {/* Dark-only ambient orbs */}
      <div className="hidden dark:block pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
      </div>

      {/* ───────────── NAVBAR ───────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/80 backdrop-blur border-b border-gray-200 dark:border-slate-800/70">
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
          <Logo to="/" className="gap-2.5" />
          <div className="flex items-center gap-2 md:gap-3 text-sm font-medium">
            <ThemeToggle />
            <LangToggle />
            <Link to="/explore" className="hidden sm:inline text-capable-text dark:text-slate-300 hover:text-capable-navy dark:hover:text-white transition-colors px-2">
              {t('explore')}
            </Link>
            <a href="#ecosystem" className="hidden md:inline text-capable-text dark:text-slate-300 hover:text-capable-navy dark:hover:text-white transition-colors px-2">
              {t('ecoNav')}
            </a>
            <Link to="/docs" className="hidden md:inline text-capable-text dark:text-slate-300 hover:text-capable-navy dark:hover:text-white transition-colors px-2">
              {isRTL ? 'الدليل' : 'Guide'}
            </Link>
            <Link to="/dashboard" className="hidden sm:inline text-capable-text dark:text-slate-300 hover:text-capable-navy dark:hover:text-white transition-colors px-2">
              {t('dashboard')}
            </Link>
            <Link to="/builder" className="btn-primary text-sm py-2.5 px-5">
              {t('startBuilding')}
            </Link>
          </div>
        </div>
      </nav>

      {/* ───────────── HERO ───────────── */}
      <section className="relative z-10 bg-capable-navy dark:bg-transparent text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.08] dark:opacity-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6 md:px-8 py-20 md:py-28 text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 dark:border-indigo-400/30 bg-white/10 dark:bg-indigo-500/10 text-white/90 dark:text-indigo-200 text-xs md:text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-capable-success dark:bg-indigo-400 dark:animate-pulse" />
              {t('heroBadge')}
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="!text-white text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.15] max-w-4xl mx-auto">
              {t('heroTitle1')}<br />
              {t('heroTitle2')}{' '}
              <span className="underline decoration-capable-light decoration-4 underline-offset-8 dark:decoration-0 dark:no-underline dark:bg-gradient-to-r dark:from-indigo-400 dark:via-fuchsia-400 dark:to-cyan-400 dark:bg-clip-text dark:text-transparent">
                {t('heroHighlight')}
              </span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="text-base md:text-lg text-white/80 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              {t('heroDesc')}
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="flex items-center gap-3 mb-10 flex-wrap justify-center">
              <Link
                to="/builder"
                className="inline-flex items-center gap-2 bg-white text-capable-navy font-bold rounded-brand px-7 py-3.5 transition-colors hover:bg-capable-surface text-base dark:bg-indigo-600 dark:text-white dark:hover:bg-indigo-500 dark:shadow-[0_0_40px_rgba(79,70,229,0.4)]"
              >
                {t('heroBtnPrimary')}
                <Rocket size={18} />
              </Link>
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 bg-transparent text-white font-bold rounded-brand px-7 py-3.5 border border-white/40 dark:border-slate-700 hover:bg-white/10 dark:hover:bg-slate-800 transition-colors text-base"
              >
                {t('heroBtnSecondary')}
                <Globe size={18} />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <div className="flex items-center gap-x-6 gap-y-3 flex-wrap justify-center text-sm text-white/75 dark:text-slate-400">
              {[t('heroTrust1'), t('heroTrust2'), t('heroTrust3')].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-capable-success" />
                  {item}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────────── PAIN ───────────── */}
      <section className="relative z-10 bg-white dark:bg-transparent border-b border-gray-100 dark:border-slate-800/60">
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-20 md:py-24">
          <div className="max-w-3xl mb-12">
            <Reveal>
              <SectionLabel tone="error">
                <AlertTriangle size={12} /> {t('painLabel')}
              </SectionLabel>
            </Reveal>
            <Reveal delay={80}><h2 className="mt-4 mb-4">{t('painTitle')}</h2></Reveal>
            <Reveal delay={140}>
              <p className="text-capable-muted dark:text-slate-400 text-base md:text-lg leading-relaxed">
                {t('painSubtitle')}
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { num: t('painStat1Num'), label: t('painStat1Label'), icon: <TrendingDown size={20} /> },
              { num: t('painStat2Num'), label: t('painStat2Label'), icon: <AlertTriangle size={20} /> },
              { num: t('painStat3Num'), label: t('painStat3Label'), icon: <Clock size={20} /> },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="brand-card p-7 h-full">
                  <div className="w-10 h-10 rounded-brand bg-capable-error/10 text-capable-error flex items-center justify-center mb-5">
                    {s.icon}
                  </div>
                  <div className="text-4xl font-bold text-capable-navy dark:text-white mb-3">{s.num}</div>
                  <p className="text-capable-muted dark:text-slate-400 text-sm leading-relaxed">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={240}>
            <div className="border-s-4 border-capable-navy dark:border-indigo-400 ps-5 py-2 max-w-3xl">
              <p className="text-lg md:text-xl font-semibold text-capable-navy dark:text-white leading-relaxed">
                {t('painConclusion')}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────────── HOW IT WORKS ───────────── */}
      <section className="relative z-10 bg-capable-surface dark:bg-transparent border-b border-gray-100 dark:border-slate-800/60">
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-20 md:py-24">
          <div className="max-w-3xl mb-12">
            <Reveal>
              <SectionLabel>
                <Wand2 size={12} /> {t('howLabel')}
              </SectionLabel>
            </Reveal>
            <Reveal delay={80}><h2 className="mt-4">{t('howTitle')}</h2></Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: t('step1Num'), title: t('step1Title'), desc: t('step1Desc'), icon: <MessageSquare size={20} /> },
              { num: t('step2Num'), title: t('step2Title'), desc: t('step2Desc'), icon: <Wand2 size={20} /> },
              { num: t('step3Num'), title: t('step3Title'), desc: t('step3Desc'), icon: <Share2 size={20} /> },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="brand-card p-7 h-full">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-brand bg-capable-navy/10 dark:bg-indigo-500/10 text-capable-navy dark:text-indigo-300 flex items-center justify-center">
                      {s.icon}
                    </div>
                    <span className="text-sm font-bold text-capable-light dark:text-indigo-400 tracking-widest">{s.num}</span>
                  </div>
                  <h3 className="text-xl font-bold text-capable-navy dark:text-white mb-3">{s.title}</h3>
                  <p className="text-capable-muted dark:text-slate-400 text-sm md:text-base leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── COMPARISON ───────────── */}
      <section className="relative z-10 bg-white dark:bg-transparent border-b border-gray-100 dark:border-slate-800/60">
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-20 md:py-24">
          <div className="max-w-3xl mb-12">
            <Reveal><h2>{t('comparisonTitle')}</h2></Reveal>
            <Reveal delay={80}>
              <p className="mt-3 text-capable-muted dark:text-slate-400 text-base md:text-lg">{t('comparisonSubtitle')}</p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Without */}
            <Reveal>
              <div className="brand-card p-7 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-brand bg-capable-error/10 text-capable-error flex items-center justify-center">
                    <X size={20} />
                  </div>
                  <h3 className="!text-capable-error !text-lg !font-bold m-0">{t('comparisonOldLabel')}</h3>
                </div>
                <ul className="space-y-4">
                  {[t('comparisonOld1'), t('comparisonOld2'), t('comparisonOld3'), t('comparisonOld4')].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-capable-muted dark:text-slate-400">
                      <X size={18} className="text-capable-error shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* With */}
            <Reveal delay={100}>
              <div className="rounded-brand p-7 h-full bg-capable-navy dark:bg-gradient-to-br dark:from-indigo-950/60 dark:to-slate-900/60 text-white shadow-brand-lg dark:shadow-none dark:border dark:border-indigo-500/40">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-brand bg-capable-success/20 text-capable-success flex items-center justify-center">
                    <CheckCircle2 size={20} />
                  </div>
                  <h3 className="!text-white !text-lg !font-bold m-0">{t('comparisonNewLabel')}</h3>
                </div>
                <ul className="space-y-4">
                  {[t('comparisonNew1'), t('comparisonNew2'), t('comparisonNew3'), t('comparisonNew4')].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/90">
                      <CheckCircle2 size={18} className="text-capable-success shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────────── SHOWCASE ───────────── */}
      <section className="relative z-10 bg-capable-surface dark:bg-transparent border-b border-gray-100 dark:border-slate-800/60">
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-20 md:py-24">
          <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
            <div className="max-w-2xl">
              <Reveal>
                <SectionLabel>
                  <TrendingUp size={12} /> {t('showcaseLabel')}
                </SectionLabel>
              </Reveal>
              <Reveal delay={80}><h2 className="mt-4 mb-3">{t('showcaseTitle')}</h2></Reveal>
              <Reveal delay={140}>
                <p className="text-capable-muted dark:text-slate-400 text-base md:text-lg">{t('showcaseDesc')}</p>
              </Reveal>
            </div>
            <Reveal delay={200}>
              <Link to="/explore" className="btn-text">
                {t('showcaseViewAll')} {ArrowIcon}
              </Link>
            </Reveal>
          </div>

          {templates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {templates.map((tpl, i) => {
                const primary = isRTL ? (tpl.nameAr || tpl.nameEn) : (tpl.nameEn || tpl.nameAr);
                const secondary = isRTL ? tpl.nameEn : tpl.nameAr;
                const showSecondary = secondary && secondary !== primary;
                const CardTag = tpl.previewUrl ? 'a' : Link;
                const linkProps = tpl.previewUrl
                  ? { href: tpl.previewUrl, target: '_blank', rel: 'noreferrer' }
                  : { to: '/explore' };
                return (
                <Reveal key={tpl.id} delay={i * 50}>
                  <CardTag
                    {...linkProps}
                    className="group block brand-card overflow-hidden hover:border-capable-light dark:hover:border-indigo-500/50 hover:shadow-brand transition-all h-full flex flex-col"
                  >
                    <div className="relative aspect-video bg-capable-surface dark:bg-slate-950 overflow-hidden border-b border-gray-200 dark:border-slate-800">
                      {tpl.image ? (
                        <img
                          src={tpl.image}
                          alt={primary}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-capable-navy/10 to-capable-surface dark:from-indigo-900/40 dark:to-slate-900 flex items-center justify-center">
                          <Sparkles className="text-capable-navy/40 dark:text-indigo-400/60" size={32} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-capable-navy/60 dark:bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="bg-white text-capable-navy px-4 py-1.5 rounded-brand text-xs font-bold flex items-center gap-1.5">
                          <Eye size={12} /> {t('showcasePreview')}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0">
                          <h3 className="!text-base !font-bold !text-capable-navy dark:!text-white m-0 truncate" dir={isRTL ? 'rtl' : 'ltr'}>{primary}</h3>
                          {showSecondary && (
                            <p className="text-xs text-capable-muted dark:text-slate-500 truncate" dir={isRTL ? 'ltr' : 'rtl'}>{secondary}</p>
                          )}
                        </div>
                        {tpl.price > 0 ? (
                          <span className="text-xs font-bold text-capable-warning shrink-0">${tpl.price}</span>
                        ) : (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">{t('showcaseFree')}</span>
                        )}
                      </div>
                      <p className="text-xs text-capable-muted dark:text-slate-500 line-clamp-2 mb-3">
                        {tpl.description || t('showcaseTemplateDesc')}
                      </p>
                      <div className="text-xs text-capable-muted dark:text-slate-500 mt-auto flex items-center gap-2">
                        <span>{tpl.author || t('appName')}</span>
                        <span>·</span>
                        <span>♥ {tpl.likes}</span>
                      </div>
                    </div>
                  </CardTag>
                </Reveal>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="brand-card overflow-hidden">
                  <div className="aspect-video bg-gray-200/50 dark:bg-slate-800/40 animate-pulse" />
                  <div className="p-4">
                    <div className="h-4 bg-gray-200/70 dark:bg-slate-800/60 rounded animate-pulse w-2/3 mb-2" />
                    <div className="h-3 bg-gray-200/50 dark:bg-slate-800/40 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ───────────── FEATURES ───────────── */}
      <section className="relative z-10 bg-white dark:bg-transparent border-b border-gray-100 dark:border-slate-800/60">
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-20 md:py-24">
          <div className="max-w-3xl mb-12">
            <Reveal><SectionLabel>{t('featuresLabel')}</SectionLabel></Reveal>
            <Reveal delay={80}><h2 className="mt-4">{t('featuresTitle')}</h2></Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: t('feature1Title'), desc: t('feature1Desc'), icon: <Sparkles size={20} /> },
              { title: t('feature2Title'), desc: t('feature2Desc'), icon: <Code2 size={20} /> },
              { title: t('feature3Title'), desc: t('feature3Desc'), icon: <Globe size={20} /> },
            ].map((f, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="brand-card p-7 h-full hover:border-capable-light dark:hover:border-indigo-500/50 hover:shadow-brand transition-all">
                  <div className="w-10 h-10 rounded-brand bg-capable-navy/10 dark:bg-indigo-500/10 text-capable-navy dark:text-indigo-300 flex items-center justify-center mb-5">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold text-capable-navy dark:text-white mb-3">{f.title}</h3>
                  <p className="text-capable-muted dark:text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── ECOSYSTEM ───────────── */}
      <section id="ecosystem" className="relative z-10 scroll-mt-20 bg-capable-surface dark:bg-transparent border-b border-gray-100 dark:border-slate-800/60">
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-20 md:py-24">
          <div className="max-w-3xl mb-12">
            <Reveal>
              <SectionLabel>
                <Sparkles size={12} /> {t('ecoLabel')}
              </SectionLabel>
            </Reveal>
            <Reveal delay={80}><h2 className="mt-4 mb-3">{t('ecoTitle')}</h2></Reveal>
            <Reveal delay={140}>
              <p className="text-capable-muted dark:text-slate-400 text-base md:text-lg leading-relaxed">{t('ecoSubtitle')}</p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                to: '/marketplace',
                icon: <Store size={20} />,
                accent: 'bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300',
                title: t('ecoMarketTitle'),
                desc: t('ecoMarketDesc'),
                cta: t('ecoMarketCta'),
              },
              {
                to: '/challenges',
                icon: <Trophy size={20} />,
                accent: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
                title: t('ecoChallengeTitle'),
                desc: t('ecoChallengeDesc'),
                cta: t('ecoChallengeCta'),
              },
              {
                to: '/influence',
                icon: <Sparkles size={20} />,
                accent: 'bg-capable-navy/10 text-capable-navy dark:bg-indigo-500/15 dark:text-indigo-300',
                title: t('ecoInfluenceTitle'),
                desc: t('ecoInfluenceDesc'),
                cta: t('ecoInfluenceCta'),
              },
            ].map((card, i) => (
              <Reveal key={card.to} delay={i * 100}>
                <Link
                  to={card.to}
                  className="group block brand-card p-7 h-full flex flex-col hover:border-capable-light dark:hover:border-indigo-500/50 hover:shadow-brand transition-all"
                >
                  <div className={`w-10 h-10 rounded-brand flex items-center justify-center mb-5 ${card.accent}`}>
                    {card.icon}
                  </div>
                  <h3 className="text-xl font-bold text-capable-navy dark:text-white mb-3">{card.title}</h3>
                  <p className="text-capable-muted dark:text-slate-400 text-sm md:text-base leading-relaxed mb-5 flex-1">{card.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-capable-navy dark:text-indigo-300 group-hover:gap-2.5 transition-all">
                    {card.cta} {ArrowIcon}
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── PRICING ───────────── */}
      <PricingSection t={t} isRTL={isRTL} />

      {/* ───────────── FINAL CTA ───────────── */}
      <section className="relative z-10 bg-capable-navy dark:bg-transparent">
        <div className="max-w-4xl mx-auto px-6 md:px-8 py-20 md:py-24 text-center">
          <div className="dark:relative dark:bg-gradient-to-br dark:from-indigo-600/20 dark:via-fuchsia-600/10 dark:to-cyan-500/20 dark:border dark:border-indigo-500/30 dark:rounded-[2rem] dark:p-10 dark:md:p-16 dark:overflow-hidden">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/10 text-white text-xs font-semibold mb-6 uppercase tracking-wider">
                <Target size={12} /> {t('finalLabel')}
              </div>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="!text-white text-3xl md:text-4xl mb-5 max-w-3xl mx-auto">
                {t('finalTitle')}
              </h2>
            </Reveal>
            <Reveal delay={140}>
              <p className="text-white/80 dark:text-slate-300 text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
                {t('finalDesc')}
              </p>
            </Reveal>
            <Reveal delay={200}>
              <Link
                to="/builder"
                className="inline-flex items-center gap-2 bg-white text-capable-navy font-bold rounded-brand px-8 py-4 transition-colors hover:bg-capable-surface text-base md:text-lg dark:shadow-[0_0_60px_rgba(255,255,255,0.2)]"
              >
                {t('finalBtn')}
                <Rocket size={20} />
              </Link>
            </Reveal>
            <Reveal delay={260}>
              <p className="text-white/60 dark:text-slate-400 text-sm mt-6">{t('finalNote')}</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────────── FOOTER ───────────── */}
      <footer className="relative z-10 bg-white dark:bg-transparent border-t border-gray-200 dark:border-slate-800/60">
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-8 flex items-center justify-between flex-wrap gap-4">
          <Logo to={null} size="sm" />
          <p className="text-sm text-capable-muted dark:text-slate-500">
            © {new Date().getFullYear()} {t('appName')}
          </p>
        </div>
      </footer>
    </div>
  );
}
