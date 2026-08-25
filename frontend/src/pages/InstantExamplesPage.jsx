import React, { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useLang } from '../i18n/LangContext.jsx';
import LangToggle from '../components/LangToggle.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import Logo from '../components/Logo.jsx';
import { TIERS } from '../components/QuickSiteDetailsForm.jsx';
import { API_BASE as API } from '../utils/api.js';

// One static, deterministic example per tier (served by the backend from the
// same template used as the AI-generation fallback — no live customer data,
// can't fail). Lives inside the instant-site funnel so previewing a tier
// never sends the customer off to the general Explore gallery, where they'd
// be free to wander the rest of the site and lose the checkout intent.
export default function InstantExamplesPage() {
  const { t, isRTL, lang } = useLang();
  const [searchParams] = useSearchParams();
  const focusTier = searchParams.get('tier');
  const refs = useRef({});
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  useEffect(() => {
    if (focusTier && refs.current[focusTier]) {
      refs.current[focusTier].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [focusTier]);

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

      <div className="max-w-3xl mx-auto px-6 py-10 md:py-14">
        <Link
          to="/instant"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-capable-navy dark:text-indigo-300 mb-6"
        >
          <BackIcon size={15} />
          {t('instantExamplesBack')}
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold text-capable-navy dark:text-white mb-1">
          {t('instantExamplesTitle')}
        </h1>
        <p className="text-capable-muted dark:text-slate-400 mb-8">{t('instantExamplesSubtitle')}</p>

        <div className="space-y-10">
          {TIERS.map(tr => (
            <div key={tr.key} ref={el => { refs.current[tr.key] = el; }} className="scroll-mt-24">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{tr.icon}</span>
                <h2 className="font-bold text-capable-navy dark:text-white">{t(`instantTier_${tr.key}_name`)}</h2>
              </div>
              <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-800 shadow-brand-lg">
                <div className="flex items-center gap-1.5 px-3.5 py-3 bg-gray-100 dark:bg-slate-800">
                  <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600" />
                  <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600" />
                  <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600" />
                </div>
                <iframe
                  src={`${API}/api/quick-site/example/${tr.key}?lang=${lang}`}
                  title={t(`instantTier_${tr.key}_name`)}
                  className="w-full h-[60vh] bg-white"
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>

        <Link
          to="/instant"
          className="btn-primary mt-10 inline-flex items-center justify-center gap-2 py-3 px-7"
        >
          <BackIcon size={16} />
          {t('instantExamplesBack')}
        </Link>
      </div>
    </div>
  );
}
