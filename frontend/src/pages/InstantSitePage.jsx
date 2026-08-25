import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ExternalLink, Loader2, Lock, Rocket } from 'lucide-react';
import { useLang } from '../i18n/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import LangToggle from '../components/LangToggle.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import Logo from '../components/Logo.jsx';
import QuickSiteDetailsForm, { TIERS } from '../components/QuickSiteDetailsForm.jsx';
import { API_BASE as API } from '../utils/api.js';

const STEP_TITLES = {
  ar: ['نوع المشروع', 'الدفع', 'موقعك'],
  en: ['Project type', 'Payment', 'Your site'],
};

function ProgressBar({ step, isRTL }) {
  const titles = STEP_TITLES[isRTL ? 'ar' : 'en'];
  return (
    <div className="max-w-2xl mx-auto mb-8">
      <div className="flex items-center justify-between text-xs text-capable-muted dark:text-slate-500 mb-2">
        <span>{isRTL ? `الخطوة ${step} من 3` : `Step ${step} of 3`}</span>
        <span className="font-semibold text-capable-navy dark:text-indigo-300">{titles[step - 1]}</span>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3].map(n => (
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
  const [whatsapp, setWhatsapp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Set once payment succeeds (simulated/dev mode only — real Stripe payments
  // redirect away and come back to InstantSiteFinish instead).
  const [session, setSession] = useState(null); // { projectId, token }

  const tierObj = TIERS.find(x => x.key === tier);

  const pickTier = (key) => { setTier(key); setStep(2); };

  const canPay = tier && whatsapp.replace(/\D/g, '').length >= 8;

  const pay = async () => {
    if (!canPay || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/quick-site/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, whatsapp, language: lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('instantErrorGeneric'));

      if (data.simulated) {
        loginWithToken(data.token, data.user);
        setSession({ projectId: data.project_id, token: data.token });
        setStep(3);
        setSubmitting(false);
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

            {/* Step 2 — payment (WhatsApp number, then pay) */}
            {step === 2 && tierObj && (
              <>
                <p className="text-xs font-semibold text-capable-navy dark:text-indigo-300 mb-1">
                  {t(`instantTier_${tier}_name`)} · {tierObj.priceSar} {t('instantSar')}
                </p>
                <h2 className="text-lg font-bold text-capable-navy dark:text-white mb-1">{t('instantPaymentHeading')}</h2>
                <p className="text-sm text-capable-muted dark:text-slate-400 mb-6">{t('instantPaymentHelp')}</p>

                <label className="block text-sm font-medium text-capable-text dark:text-slate-300 mb-2">
                  {t('instantWhatsappLabel')}
                </label>
                <input
                  autoFocus
                  type="tel"
                  dir="ltr"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  placeholder="+9665XXXXXXXX"
                  disabled={submitting}
                  className="w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-brand px-4 py-3 mb-2 focus:outline-none focus:border-capable-navy dark:focus:border-indigo-400 disabled:opacity-60"
                />
                <p className="text-xs text-capable-muted dark:text-slate-500 mb-6">{t('instantWhatsappHint')}</p>

                <div className="flex items-start gap-2 mb-6 p-3 rounded-brand bg-capable-surface dark:bg-slate-900/60">
                  <Lock size={14} className="text-capable-success shrink-0 mt-0.5" />
                  <p className="text-xs text-capable-muted dark:text-slate-400">{t('instantSecureNote')}</p>
                </div>

                {error && <p className="text-sm text-capable-error mb-4">{error}</p>}

                <div className="flex items-center gap-3 mt-auto">
                  <button onClick={() => setStep(1)} disabled={submitting} className="text-sm font-semibold text-capable-muted dark:text-slate-400 disabled:opacity-40">
                    {t('instantBack')}
                  </button>
                  <button
                    onClick={pay}
                    disabled={!canPay || submitting}
                    className="btn-primary text-sm py-3 px-7 inline-flex items-center gap-2 disabled:opacity-60"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
                    {t('instantPayNow')} — {tierObj.priceSar} {t('instantSar')}
                  </button>
                </div>
              </>
            )}

            {/* Step 3 — post-payment: site name, detail, style → generate */}
            {step === 3 && session && (
              <QuickSiteDetailsForm
                tierKey={tier}
                projectId={session.projectId}
                token={session.token}
                language={lang}
                isRTL={isRTL}
                t={t}
                onDone={(data) => navigate('/instant/ready', { state: { slug: data.slug, url: data.url } })}
              />
            )}
        </div>
      </div>
    </div>
  );
}
