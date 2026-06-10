import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../i18n/LangContext.jsx';
import { API_BASE as API } from '../utils/api.js';

// Star row — display-only, or interactive when `onChange` is provided.
export function Stars({ value = 0, onChange, size = 18 }) {
  const [hover, setHover] = useState(0);
  const interactive = typeof onChange === 'function';
  return (
    <div className="inline-flex items-center gap-0.5" role={interactive ? 'radiogroup' : undefined}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          onClick={interactive ? () => onChange(i) : undefined}
          onMouseEnter={interactive ? () => setHover(i) : undefined}
          onMouseLeave={interactive ? () => setHover(0) : undefined}
          className={`${interactive ? 'cursor-pointer transition-transform hover:scale-110' : ''} ${(hover || value) >= i ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
        />
      ))}
    </div>
  );
}

// Dashboard card: the signed-in user rates the platform (one review per user).
export function ReviewWidget() {
  const { authFetch } = useAuth();
  const { lang } = useLang();
  const ar = lang === 'ar';
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    authFetch('/api/reviews/mine').then((r) => r.json()).then((d) => {
      if (d && d.rating) { setRating(d.rating); setComment(d.comment || ''); setSaved(true); }
    }).catch(() => {});
  }, []);

  const submit = async () => {
    if (!rating) return;
    const res = await authFetch('/api/reviews', { method: 'POST', body: JSON.stringify({ rating, comment }) });
    if (res.ok) setSaved(true);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <h3 className="text-sm font-bold text-white mb-1">{ar ? 'قيّم تجربتك مع كيبابل' : 'Rate your Capable experience'}</h3>
      <p className="text-xs text-slate-500 mb-3">{ar ? 'رأيك يظهر كنجوم حقيقية على الصفحة الرئيسية.' : 'Your rating powers the real stars shown on the homepage.'}</p>
      <Stars value={rating} onChange={(v) => { setRating(v); setSaved(false); }} size={26} />
      <textarea
        value={comment}
        onChange={(e) => { setComment(e.target.value); setSaved(false); }}
        placeholder={ar ? 'شاركنا رأيك (اختياري)' : 'Share your thoughts (optional)'}
        rows={2}
        className="mt-3 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
      />
      <button
        onClick={submit}
        disabled={!rating || saved}
        className="mt-2 w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
      >
        {saved ? (ar ? 'تم الحفظ ✓' : 'Saved ✓') : (ar ? 'إرسال التقييم' : 'Submit rating')}
      </button>
    </div>
  );
}

// Landing social-proof section + the legitimate, real-number aggregateRating
// JSON-LD (injected only when there are actual reviews).
export function Testimonials() {
  const { lang, isRTL } = useLang();
  const ar = lang === 'ar';
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/reviews`).then((r) => r.json()).then(setData).catch(() => setData(null));
  }, []);

  useEffect(() => {
    if (!data || !data.count) return;
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.id = 'capable-aggregate-rating';
    s.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Capable',
      applicationCategory: 'WebApplication',
      operatingSystem: 'Web',
      url: 'https://capable.live/',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: String(data.average),
        reviewCount: String(data.count),
        bestRating: '5',
        worstRating: '1',
      },
    });
    document.head.appendChild(s);
    return () => { document.getElementById('capable-aggregate-rating')?.remove(); };
  }, [data]);

  if (!data || !data.count) return null;

  return (
    <section className="relative z-10 bg-white dark:bg-transparent border-b border-gray-100 dark:border-slate-800/60">
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-20 md:py-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-3">
            <Stars value={Math.round(data.average)} size={22} />
            <span className="text-2xl font-extrabold text-capable-navy dark:text-white">{data.average}</span>
          </div>
          <p className="text-capable-muted dark:text-slate-400 text-sm">
            {ar ? `بناءً على ${data.count} تقييماً حقيقياً من المستخدمين` : `Based on ${data.count} real user ${data.count === 1 ? 'rating' : 'ratings'}`}
          </p>
        </div>

        {data.reviews && data.reviews.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.reviews.map((r, i) => (
              <div key={i} className="brand-card p-6 h-full flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
                <Stars value={r.rating} size={15} />
                <p className="text-capable-text dark:text-slate-300 text-sm leading-relaxed mt-3 flex-1">“{r.comment}”</p>
                <div className="text-xs text-capable-muted dark:text-slate-500 mt-4">{r.author_name || (ar ? 'مستخدم' : 'User')}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
