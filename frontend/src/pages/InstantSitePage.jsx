import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ExternalLink, Loader2, Rocket } from 'lucide-react';
import { useLang } from '../i18n/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import LangToggle from '../components/LangToggle.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import Logo from '../components/Logo.jsx';
import { API_BASE as API } from '../utils/api.js';

const TIERS = [
  {
    key: 'simple', icon: '📄', priceSar: 50, exampleCategory: 'portfolio',
    question: { ar: 'ما الهدف الأساسي من الموقع؟', en: "What's the main goal of your site?" },
    options: {
      ar: ['عرض أعمالي', 'التعريف بخدماتي', 'معلومات تواصل'],
      en: ['Showcase my work', 'Explain my services', 'Contact info'],
    },
  },
  {
    key: 'store', icon: '🛍️', priceSar: 75, exampleCategory: 'ecommerce',
    question: { ar: 'ماذا تبيع في متجرك؟', en: 'What do you sell in your store?' },
    options: {
      ar: ['ملابس وأزياء', 'إلكترونيات وتقنية', 'مستحضرات تجميل وعناية', 'منتجات منزلية'],
      en: ['Clothing & fashion', 'Electronics & tech', 'Beauty & care products', 'Home goods'],
    },
  },
  {
    key: 'booking', icon: '📅', priceSar: 75, exampleCategory: 'food',
    question: { ar: 'ما نوع نشاطك؟', en: 'What type of business is this?' },
    options: {
      ar: ['مطعم أو مقهى', 'عيادة أو صالون', 'حجوزات وخدمات عامة'],
      en: ['Restaurant or café', 'Clinic or salon', 'General bookings & services'],
    },
  },
  {
    key: 'marketplace', icon: '🏪', priceSar: 100, exampleCategory: 'ecommerce',
    question: { ar: 'ما نوع السوق الذي تريده؟', en: 'What kind of marketplace is this?' },
    options: {
      ar: ['منتجات يدوية وحرفية', 'أزياء ومنتجات متنوعة', 'خدمات ومستقلين'],
      en: ['Handmade & crafts', 'Fashion & general goods', 'Services & freelancers'],
    },
  },
];

const STYLES = [
  { key: 'calm', ar: 'أنيق وهادئ', en: 'Calm & elegant', sub: { ar: 'بساطة ووضوح', en: 'Simple and clear' }, primary: '#1F4788', secondary: '#6B7280', radius: '10px', dark: false },
  { key: 'warm', ar: 'دافئ وودود', en: 'Warm & friendly', sub: { ar: 'قريب وبسيط', en: 'Approachable and easy' }, primary: '#4A7BC8', secondary: '#F59E0B', radius: '999px', dark: false },
  { key: 'bold', ar: 'جريء وعصري', en: 'Bold & modern', sub: { ar: 'واضح وقوي', en: 'Sharp and strong' }, primary: '#1F2937', secondary: '#1F4788', radius: '4px', dark: false },
  { key: 'premium', ar: 'فخم وراقي', en: 'Premium & refined', sub: { ar: 'أناقة داكنة', en: 'Dark elegance' }, primary: '#1F4788', secondary: '#2E5FA3', radius: '14px', dark: true },
];

const STEP_TITLES = {
  ar: ['نوع المشروع', 'التفاصيل', 'الستايل', 'المعاينة والدفع'],
  en: ['Project type', 'Details', 'Style', 'Preview & pay'],
};

function SitePreviewMock({ tierObj, siteName, detail, styleObj, isRTL, t }) {
  const dark = styleObj.dark;
  const fg = dark ? '#F8FAFC' : styleObj.primary;
  const muted = dark ? '#94A3B8' : '#6B7280';
  return (
    <div
      className="rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden mb-6 shadow-sm"
      style={{ background: dark ? '#0B1220' : '#fff' }}
    >
      <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-800">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
      </div>
      <div className="p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between mb-8">
          <span className="font-bold text-sm truncate" style={{ color: fg }}>
            {siteName || t('instantSiteNamePlaceholder')}
          </span>
          <span className="text-xl shrink-0">{tierObj.icon}</span>
        </div>
        <h3 className="text-lg font-bold mb-2" style={{ color: fg }}>
          {siteName || t('instantSiteNamePlaceholder')}
        </h3>
        {detail && <p className="text-xs mb-5" style={{ color: muted }}>{detail}</p>}
        <button
          type="button"
          className="text-xs font-semibold px-4 py-2"
          style={{ background: styleObj.primary, color: '#fff', borderRadius: styleObj.radius }}
        >
          {t('instantPreviewCta')}
        </button>
      </div>
    </div>
  );
}

function ProgressBar({ step, isRTL }) {
  const titles = STEP_TITLES[isRTL ? 'ar' : 'en'];
  return (
    <div className="max-w-2xl mx-auto mb-8">
      <div className="flex items-center justify-between text-xs text-capable-muted dark:text-slate-500 mb-2">
        <span>{isRTL ? `الخطوة ${step} من 4` : `Step ${step} of 4`}</span>
        <span className="font-semibold text-capable-navy dark:text-indigo-300">{titles[step - 1]}</span>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className="h-1.5 flex-1 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-capable-navy dark:bg-indigo-500 transition-all duration-500"
              style={{ width: n <= step ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InstantSitePage() {
  const { t, isRTL, lang } = useLang();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [tier, setTier] = useState(searchParams.get('tier') || null);
  const [step, setStep] = useState(searchParams.get('tier') ? 2 : 1);
  const [siteName, setSiteName] = useState('');
  const [detail, setDetail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [styleKey, setStyleKey] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const tierObj = TIERS.find(x => x.key === tier);
  const styleObj = STYLES.find(x => x.key === styleKey) || STYLES[0];

  const detailOptions = useMemo(() => {
    if (!tierObj) return [];
    return tierObj.options[isRTL ? 'ar' : 'en'];
  }, [tierObj, isRTL]);

  const pickTier = (key) => { setTier(key); setStep(2); };
  const pickStyle = (key) => { setStyleKey(key); setStep(4); };

  const canSubmit = tier && siteName.trim().length > 0 && whatsapp.replace(/\D/g, '').length >= 8 && styleKey;

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/quick-site/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, site_name: siteName.trim(), whatsapp, language: lang, style: styleKey, detail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('instantErrorGeneric'));

      if (data.simulated) {
        loginWithToken(data.token, data.user);
        navigate('/instant/ready', { state: { slug: data.slug, url: data.url } });
      } else {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err.message || t('instantErrorGeneric'));
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/80 backdrop-blur border-b border-gray-200 dark:border-slate-800/70">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo to="/" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LangToggle />
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10 md:py-14">
        <h1 className="text-2xl md:text-3xl font-bold text-capable-navy dark:text-white mb-1 text-center">
          {t('instantTitle')}
        </h1>
        <p className="text-capable-muted dark:text-slate-400 mb-8 text-center">{t('instantSubtitle')}</p>

        <ProgressBar step={step} isRTL={isRTL} />

        <div className="brand-card p-7 min-h-[440px] flex flex-col">
            {/* Step 1 — type */}
            {step === 1 && (
              <>
                <h2 className="text-lg font-bold text-capable-navy dark:text-white mb-1">{t('instantStep1Heading')}</h2>
                <p className="text-sm text-capable-muted dark:text-slate-400 mb-6">{t('instantStep1Help')}</p>
                <div className="grid grid-cols-2 gap-3 flex-1">
                  {TIERS.map(tr => (
                    <div key={tr.key} className="border-2 border-gray-100 dark:border-slate-800 rounded-2xl p-4 hover:border-capable-light dark:hover:border-indigo-500/50 transition-all flex flex-col">
                      <button onClick={() => pickTier(tr.key)} className="text-start flex-1">
                        <div className="text-2xl mb-2">{tr.icon}</div>
                        <div className="font-bold text-sm text-capable-navy dark:text-white mb-0.5">{t(`instantTier_${tr.key}_name`)}</div>
                        <div className="text-xs text-capable-muted dark:text-slate-500">{tr.priceSar} {t('instantSar')}</div>
                      </button>
                      <a
                        href={`/explore?category=${tr.exampleCategory}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-capable-navy dark:text-indigo-300"
                      >
                        {t('instantSeeExample')} <ExternalLink size={11} />
                      </a>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Step 2 — details (name + chip + whatsapp) */}
            {step === 2 && tierObj && (
              <>
                <p className="text-xs font-semibold text-capable-navy dark:text-indigo-300 mb-1">
                  {t(`instantTier_${tier}_name`)} · {tierObj.priceSar} {t('instantSar')}
                </p>
                <h2 className="text-lg font-bold text-capable-navy dark:text-white mb-6">{t('instantStep2Heading')}</h2>

                <label className="block text-sm font-medium text-capable-text dark:text-slate-300 mb-2">
                  {t('instantSiteNameLabel')}
                </label>
                <input
                  autoFocus
                  value={siteName}
                  onChange={e => setSiteName(e.target.value)}
                  placeholder={t('instantSiteNamePlaceholder')}
                  maxLength={120}
                  className="w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-brand px-4 py-3 mb-5 focus:outline-none focus:border-capable-navy dark:focus:border-indigo-400"
                />

                <label className="block text-sm font-medium text-capable-text dark:text-slate-300 mb-2">
                  {tierObj.question[isRTL ? 'ar' : 'en']}
                </label>
                <div className="flex flex-wrap gap-2 mb-5">
                  {detailOptions.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setDetail(opt)}
                      className={`px-3.5 py-2 rounded-full text-xs font-medium border transition-colors ${
                        detail === opt
                          ? 'bg-capable-navy border-capable-navy text-white dark:bg-indigo-600 dark:border-indigo-600'
                          : 'border-gray-200 dark:border-slate-700 text-capable-text dark:text-slate-300 hover:border-capable-light dark:hover:border-indigo-500/50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <label className="block text-sm font-medium text-capable-text dark:text-slate-300 mb-2">
                  {t('instantWhatsappLabel')}
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  placeholder="+9665XXXXXXXX"
                  className="w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-brand px-4 py-3 focus:outline-none focus:border-capable-navy dark:focus:border-indigo-400"
                />

                <div className="flex items-center gap-3 mt-auto pt-6">
                  <button onClick={() => setStep(1)} className="text-sm font-semibold text-capable-muted dark:text-slate-400">
                    {t('instantBack')}
                  </button>
                  <button
                    disabled={!siteName.trim() || !detail || whatsapp.replace(/\D/g, '').length < 8}
                    onClick={() => setStep(3)}
                    className="btn-primary text-sm py-2.5 px-6 disabled:opacity-50"
                  >
                    {t('instantNext')}
                  </button>
                </div>
              </>
            )}

            {/* Step 3 — style */}
            {step === 3 && (
              <>
                <h2 className="text-lg font-bold text-capable-navy dark:text-white mb-1">{t('instantStep3Heading')}</h2>
                <p className="text-sm text-capable-muted dark:text-slate-400 mb-6">{t('instantStep3Help')}</p>
                <div className="grid grid-cols-2 gap-3 flex-1">
                  {STYLES.map(s => (
                    <button
                      key={s.key}
                      onClick={() => pickStyle(s.key)}
                      className="text-start border-2 border-gray-100 dark:border-slate-800 rounded-2xl p-4 hover:border-capable-light dark:hover:border-indigo-500/50 transition-all"
                    >
                      <div className="font-bold text-sm text-capable-navy dark:text-white mb-0.5">{s[isRTL ? 'ar' : 'en']}</div>
                      <div className="text-xs text-capable-muted dark:text-slate-500 mb-3">{s.sub[isRTL ? 'ar' : 'en']}</div>
                      <div className="flex gap-1.5">
                        <span className="w-4 h-4 rounded" style={{ background: s.primary }} />
                        <span className="w-4 h-4 rounded" style={{ background: s.secondary }} />
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-6">
                  <button onClick={() => setStep(2)} className="text-sm font-semibold text-capable-muted dark:text-slate-400">
                    {t('instantBack')}
                  </button>
                </div>
              </>
            )}

            {/* Step 4 — preview & pay */}
            {step === 4 && tierObj && (
              <>
                <h2 className="text-lg font-bold text-capable-navy dark:text-white mb-1">{t('instantStep4Heading')}</h2>
                <p className="text-sm text-capable-muted dark:text-slate-400 mb-6">{t('instantStep4Help')}</p>
                <SitePreviewMock tierObj={tierObj} siteName={siteName} detail={detail} styleObj={styleObj} isRTL={isRTL} t={t} />
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm text-capable-text dark:text-slate-300">
                    <CheckCircle2 size={16} className="text-capable-success shrink-0" />
                    {t(`instantTier_${tier}_name`)}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-capable-text dark:text-slate-300">
                    <CheckCircle2 size={16} className="text-capable-success shrink-0" />
                    {siteName}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-capable-text dark:text-slate-300">
                    <CheckCircle2 size={16} className="text-capable-success shrink-0" />
                    {styleObj[isRTL ? 'ar' : 'en']}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-capable-text dark:text-slate-300" dir="ltr">
                    <CheckCircle2 size={16} className="text-capable-success shrink-0" />
                    {whatsapp}
                  </li>
                </ul>
                {error && <p className="text-sm text-capable-error mb-4">{error}</p>}
                {submitting && <p className="text-xs text-capable-muted dark:text-slate-500 mb-4">{t('instantGenerating')}</p>}
                <div className="flex items-center gap-3 mt-auto">
                  <button onClick={() => setStep(3)} disabled={submitting} className="text-sm font-semibold text-capable-muted dark:text-slate-400 disabled:opacity-40">
                    {t('instantBack')}
                  </button>
                  <button
                    onClick={submit}
                    disabled={submitting}
                    className="btn-primary text-sm py-3 px-7 inline-flex items-center gap-2 disabled:opacity-60"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
                    {t('instantPayNow')} — {tierObj.priceSar} {t('instantSar')}
                  </button>
                </div>
              </>
            )}

        </div>
      </div>
    </div>
  );
}
