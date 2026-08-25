import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, MessageCircle } from 'lucide-react';
import { useLang } from '../i18n/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from '../components/Logo.jsx';
import QuickSiteDetailsForm from '../components/QuickSiteDetailsForm.jsx';
import { API_BASE as API } from '../utils/api.js';

const POLL_INTERVAL_MS = 1500;
const MAX_ATTEMPTS = 20; // ~30s — just waiting on the Stripe webhook to land

// Landed here from Stripe's success_url. Payment already happened; this page
// waits for the webhook to confirm it (a short poll, since redirect and
// webhook delivery race each other), then collects site name/detail/style
// and generates the site — the same step InstantSitePage's simulated/dev
// checkout goes through inline, without a redirect away.
export default function InstantSiteFinish() {
  const { t, isRTL, lang } = useLang();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [payment, setPayment] = useState(null); // { projectId, token, tier, language }
  const [timedOut, setTimedOut] = useState(false);
  const attempts = useRef(0);

  useEffect(() => {
    if (!sessionId) { setTimedOut(true); return; }
    let cancelled = false;

    const poll = async () => {
      attempts.current += 1;
      try {
        const res = await fetch(`${API}/api/quick-site/payment-status?session_id=${encodeURIComponent(sessionId)}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.paid) {
          loginWithToken(data.token, data.user);
          setPayment({ projectId: data.project_id, token: data.token, tier: data.tier, language: data.language || lang });
          return;
        }
      } catch {
        // transient — keep polling until MAX_ATTEMPTS
      }
      if (attempts.current >= MAX_ATTEMPTS) { setTimedOut(true); return; }
      setTimeout(poll, POLL_INTERVAL_MS);
    };
    poll();

    return () => { cancelled = true; };
  }, [sessionId, loginWithToken, lang]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/80 backdrop-blur border-b border-gray-200 dark:border-slate-800/70">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Logo to="/" />
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10 md:py-14">
        <div className="brand-card p-7 min-h-[440px] flex flex-col">
          {payment ? (
            <QuickSiteDetailsForm
              tierKey={payment.tier}
              projectId={payment.projectId}
              token={payment.token}
              language={payment.language}
              isRTL={isRTL}
              t={t}
              onDone={(data) => navigate('/instant/ready', { state: { slug: data.slug, url: data.url } })}
            />
          ) : timedOut ? (
            <div className="m-auto text-center max-w-sm">
              <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-capable-warning/10 text-capable-warning flex items-center justify-center">
                <MessageCircle size={26} />
              </div>
              <h1 className="text-lg font-bold text-capable-navy dark:text-white mb-2">{t('instantMissingResultTitle')}</h1>
              <p className="text-sm text-capable-muted dark:text-slate-400">{t('instantMissingResultDesc')}</p>
            </div>
          ) : (
            <div className="m-auto text-center">
              <Loader2 size={28} className="mx-auto mb-4 animate-spin text-capable-navy dark:text-indigo-400" />
              <p className="text-sm text-capable-muted dark:text-slate-400">{t('instantConfirmingPayment')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
