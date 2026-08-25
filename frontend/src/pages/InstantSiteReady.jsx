import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Download, ExternalLink, Loader2, MessageCircle } from 'lucide-react';
import { useLang } from '../i18n/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from '../components/Logo.jsx';
import { API_BASE as API } from '../utils/api.js';

const POLL_INTERVAL_MS = 2000;
// Generation now happens post-payment (real AI call in the Stripe webhook,
// with a deterministic-template fallback), so this needs real headroom.
const MAX_ATTEMPTS = 30; // ~60s

export default function InstantSiteReady() {
  const { t } = useLang();
  const { loginWithToken } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const directResult = location.state; // { slug, url } — simulated-mode checkout already logged in

  const [result, setResult] = useState(directResult || null);
  const [timedOut, setTimedOut] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const attempts = useRef(0);

  const downloadCode = async () => {
    if (!result || downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(result.url);
      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${result.slug || 'site'}.html`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // best-effort — the site itself is still reachable even if the download fails
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (result || !sessionId) return;
    let cancelled = false;

    const poll = async () => {
      attempts.current += 1;
      try {
        const res = await fetch(`${API}/api/quick-site/status?session_id=${encodeURIComponent(sessionId)}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.ready) {
          loginWithToken(data.token, data.user);
          setResult({ slug: data.project.slug, url: data.project.url });
          return;
        }
      } catch {
        // transient — keep polling until MAX_ATTEMPTS
      }
      if (attempts.current >= MAX_ATTEMPTS) {
        setTimedOut(true);
        return;
      }
      setTimeout(poll, POLL_INTERVAL_MS);
    };
    poll();

    return () => { cancelled = true; };
  }, [result, sessionId, loginWithToken]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <nav className="py-4 px-6">
        <Logo to="/" />
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        {result ? (
          <div className="max-w-2xl w-full">
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-capable-success/10 text-capable-success flex items-center justify-center">
                <CheckCircle2 size={28} />
              </div>
              <h1 className="text-2xl font-bold text-capable-navy dark:text-white mb-2">{t('instantReadyTitle')}</h1>
              <p className="text-capable-muted dark:text-slate-400">{t('instantReadyDesc')}</p>
            </div>

            {/* Real preview of the AI-generated site, not a mockup */}
            <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-800 shadow-brand-lg mb-6">
              <div className="flex items-center gap-1.5 px-3.5 py-3 bg-gray-100 dark:bg-slate-800">
                <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600" />
                <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600" />
                <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600" />
                <span
                  className="mx-2 flex-1 text-center text-[11px] text-capable-muted dark:text-slate-400 bg-white dark:bg-slate-900 rounded px-2 py-1 truncate"
                  dir="ltr"
                >
                  {result.url.replace(/^https?:\/\//, '')}
                </span>
              </div>
              <iframe
                src={result.url}
                title={t('instantReadyTitle')}
                className="w-full h-[70vh] bg-white"
              />
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center justify-center gap-2 py-3.5 px-7"
                >
                  {t('instantViewSite')} <ExternalLink size={16} />
                </a>
                <button
                  onClick={downloadCode}
                  disabled={downloading}
                  className="inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-brand border border-gray-200 dark:border-slate-700 text-capable-navy dark:text-indigo-300 font-semibold hover:bg-capable-surface dark:hover:bg-slate-800 disabled:opacity-60"
                >
                  {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  {t('instantDownloadCode')}
                </button>
              </div>
              <Link to="/dashboard" className="block text-sm font-semibold text-capable-navy dark:text-indigo-300">
                {t('instantManageSite')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="max-w-md w-full text-center">
            {timedOut ? (
              <>
                <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-capable-warning/10 text-capable-warning flex items-center justify-center">
                  <MessageCircle size={26} />
                </div>
                <h1 className="text-2xl font-bold text-capable-navy dark:text-white mb-2">{t('instantDelayedTitle')}</h1>
                <p className="text-capable-muted dark:text-slate-400">{t('instantDelayedDesc')}</p>
              </>
            ) : (
              <>
                <Loader2 size={32} className="mx-auto mb-6 animate-spin text-capable-navy dark:text-indigo-400" />
                <h1 className="text-2xl font-bold text-capable-navy dark:text-white mb-2">{t('instantBuildingTitle')}</h1>
                <p className="text-capable-muted dark:text-slate-400">{t('instantBuildingDesc')}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
