import React, { useMemo, useState } from 'react';
import { Loader2, Rocket } from 'lucide-react';
import { API_BASE as API } from '../utils/api.js';

export const TIERS = [
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

export const STYLES = [
  { key: 'calm', ar: 'أنيق وهادئ', en: 'Calm & elegant', sub: { ar: 'بساطة ووضوح', en: 'Simple and clear' }, primary: '#1F4788', secondary: '#6B7280', radius: '10px', dark: false },
  { key: 'warm', ar: 'دافئ وودود', en: 'Warm & friendly', sub: { ar: 'قريب وبسيط', en: 'Approachable and easy' }, primary: '#4A7BC8', secondary: '#F59E0B', radius: '999px', dark: false },
  { key: 'bold', ar: 'جريء وعصري', en: 'Bold & modern', sub: { ar: 'واضح وقوي', en: 'Sharp and strong' }, primary: '#1F2937', secondary: '#1F4788', radius: '4px', dark: false },
  { key: 'premium', ar: 'فخم وراقي', en: 'Premium & refined', sub: { ar: 'أناقة داكنة', en: 'Dark elegance' }, primary: '#1F4788', secondary: '#2E5FA3', radius: '14px', dark: true },
];

// Post-payment step: collect the site name, one detail chip, and a style,
// then call /finalize to generate + publish the real site. Shared between
// InstantSitePage (simulated/dev checkout — no redirect away) and
// InstantSiteFinish (real Stripe checkout — reached after the redirect back).
export default function QuickSiteDetailsForm({ tierKey, projectId, token, language, isRTL, t, onDone }) {
  const [siteName, setSiteName] = useState('');
  const [detail, setDetail] = useState('');
  const [styleKey, setStyleKey] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const tierObj = TIERS.find(x => x.key === tierKey);
  const detailOptions = useMemo(() => (tierObj ? tierObj.options[isRTL ? 'ar' : 'en'] : []), [tierObj, isRTL]);
  const canSubmit = siteName.trim().length > 0 && !!detail && !!styleKey;

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/quick-site/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ project_id: projectId, site_name: siteName.trim(), language, style: styleKey, detail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('instantErrorGeneric'));
      onDone(data);
    } catch (err) {
      setError(err.message || t('instantErrorGeneric'));
      setSubmitting(false);
    }
  };

  if (!tierObj) return null;

  return (
    <>
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
        disabled={submitting}
        className="w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-brand px-4 py-3 mb-5 focus:outline-none focus:border-capable-navy dark:focus:border-indigo-400 disabled:opacity-60"
      />

      <label className="block text-sm font-medium text-capable-text dark:text-slate-300 mb-2">
        {tierObj.question[isRTL ? 'ar' : 'en']}
      </label>
      <div className="flex flex-wrap gap-2 mb-6">
        {detailOptions.map(opt => (
          <button
            key={opt}
            type="button"
            disabled={submitting}
            onClick={() => setDetail(opt)}
            className={`px-3.5 py-2 rounded-full text-xs font-medium border transition-colors disabled:opacity-60 ${
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
        {t('instantStep3Heading')}
      </label>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {STYLES.map(s => (
          <button
            key={s.key}
            type="button"
            disabled={submitting}
            onClick={() => setStyleKey(s.key)}
            className={`text-start border-2 rounded-2xl p-3.5 transition-all disabled:opacity-60 ${
              styleKey === s.key
                ? 'border-capable-navy dark:border-indigo-500'
                : 'border-gray-100 dark:border-slate-800 hover:border-capable-light dark:hover:border-indigo-500/50'
            }`}
          >
            <div className="font-bold text-sm text-capable-navy dark:text-white mb-0.5">{s[isRTL ? 'ar' : 'en']}</div>
            <div className="text-xs text-capable-muted dark:text-slate-500 mb-2.5">{s.sub[isRTL ? 'ar' : 'en']}</div>
            <div className="flex gap-1.5">
              <span className="w-4 h-4 rounded" style={{ background: s.primary }} />
              <span className="w-4 h-4 rounded" style={{ background: s.secondary }} />
            </div>
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-capable-error mb-4">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit || submitting}
        className="btn-primary w-full text-sm py-3.5 inline-flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
        {submitting ? t('instantGenerating') : t('instantCreateSite')}
      </button>
    </>
  );
}
