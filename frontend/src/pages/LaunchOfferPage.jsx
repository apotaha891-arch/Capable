import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n/LangContext.jsx';
import LangToggle from '../components/LangToggle.jsx';
import { API_BASE as API } from '../utils/api.js';

const CAP = 200;
const TIER = 'simple';

function getTier(pctFilled) {
  if (pctFilled >= 80) return 'red';
  if (pctFilled >= 50) return 'amber';
  return 'navy';
}

const TIER_COLORS = {
  navy: { text: 'text-capable-navy dark:text-indigo-300', badgeBg: 'bg-capable-navy/10 dark:bg-indigo-500/10', badgeText: 'text-capable-navy dark:text-indigo-300', bar: 'from-capable-light to-capable-navy' },
  amber: { text: 'text-amber-600', badgeBg: 'bg-amber-500/10', badgeText: 'text-amber-700', bar: 'from-amber-400 to-amber-700' },
  red: { text: 'text-capable-error', badgeBg: 'bg-red-500/10', badgeText: 'text-capable-error', bar: 'from-red-400 to-red-700' },
};

const COPY = {
  ar: {
    tickerCr: 'شركة Innovation Delivered — مسجّلة رسميًا بالسجل التجاري',
    tickerJoined: (n) => `${n} عميل حجزوا موقعهم حتى الآن`,
    tickerFast: 'موقعك جاهز خلال دقائق فقط',
    tickerRemaining: (n) => `تبقى ${n} مقعد فقط ضمن الـ 200`,
    tickerSoldOut: 'اكتمل عدد المقاعد المتاحة',
    tickerNoFees: 'بدون أي رسوم خفية',
    tickerPct: (p) => `${p}% من المقاعد محجوزة`,
    tickerResponsive: 'تصميم عصري متجاوب مع كل الأجهزة',
    badgeLive: 'عرض إطلاق محدود',
    badgeSoldOut: 'اكتمل العرض',
    priceUnit: 'ريال سعودي — دفعة واحدة',
    desc: 'موقعك الإلكتروني جاهز خلال دقائق: رابط احترافي خاص بك، تصميم عصري متجاوب، وبدون أي رسوم خفية.',
    ctaLive: 'اطلب موقعك الآن',
    ctaSoldOut: 'اكتمل عدد المقاعد',
    ctaSub: 'العرض متاح لأول 200 عميل فقط',
    limitNote: 'العرض ساري حتى اكتمال العدد المستهدف، ولا يتجدد تلقائيًا.',
    ofSeats: 'من 200 مقعد',
    remaining: (n) => `تبقى ${n} مقعد`,
    complete: 'اكتمل العدد',
    fetchFailedNote: 'اطلب موقعك الآن — العرض لا يزال متاحًا.',
    missionLabel: 'لماذا هذا العرض',
    missionBody: 'هذه مبادرة من شركة Innovation Delivered، شركة سعودية مسجّلة تجاريًا، نطلقها بهدف دعم رواد الأعمال والمنشآت الصغيرة في بناء حضور رقمي حقيقي بأقل تكلفة ممكنة، إيمانًا منا بأهمية التحول الرقمي في المملكة.',
    footerLine1: 'شركة Innovation Delivered — شركة سعودية مسجّلة رسميًا',
    footerCr: 'السجل التجاري رقم:',
    crPlaceholder: '[أدخل رقم السجل التجاري هنا]',
  },
  en: {
    tickerCr: 'Innovation Delivered Co. — officially registered with a commercial registration',
    tickerJoined: (n) => `${n} customers have claimed their site so far`,
    tickerFast: 'Your site is ready in minutes',
    tickerRemaining: (n) => `Only ${n} spots left out of 200`,
    tickerSoldOut: 'All available spots are claimed',
    tickerNoFees: 'No hidden fees',
    tickerPct: (p) => `${p}% of spots claimed`,
    tickerResponsive: 'Modern, responsive design on every device',
    badgeLive: 'Limited launch offer',
    badgeSoldOut: 'Offer complete',
    priceUnit: 'SAR — one-time payment',
    desc: "Your website is ready in minutes: your own professional link, a modern responsive design, and no hidden fees.",
    ctaLive: 'Get your site now',
    ctaSoldOut: 'All spots claimed',
    ctaSub: 'Offer limited to the first 200 customers',
    limitNote: "The offer runs until the target is reached and won't auto-renew.",
    ofSeats: 'of 200 spots',
    remaining: (n) => `${n} spots left`,
    complete: 'Spots filled',
    fetchFailedNote: 'Get your site now — the offer is still open.',
    missionLabel: 'Why this offer',
    missionBody: "This is an initiative from Innovation Delivered, a registered Saudi company, launched to help entrepreneurs and small businesses build a real digital presence at the lowest possible cost — because we believe in the Kingdom's digital transformation.",
    footerLine1: 'Innovation Delivered Co. — an officially registered Saudi company',
    footerCr: 'Commercial registration no.:',
    crPlaceholder: '[Enter CR number here]',
  },
};

function buildTickerItems(c, copy, remaining) {
  return [
    { icon: '✅', text: copy.tickerCr },
    { icon: '🔥', text: copy.tickerJoined(c) },
    { icon: '⚡', text: copy.tickerFast },
    { icon: '⏳', text: remaining > 0 ? copy.tickerRemaining(remaining) : copy.tickerSoldOut },
    { icon: '🔒', text: copy.tickerNoFees },
    { icon: '📈', text: copy.tickerPct(Math.round((c / CAP) * 100)) },
    { icon: '📱', text: copy.tickerResponsive },
  ];
}

export default function LaunchOfferPage() {
  const navigate = useNavigate();
  const { isRTL } = useLang();
  const copy = COPY[isRTL ? 'ar' : 'en'];
  const [count, setCount] = useState(null); // null while loading — never show a fabricated number
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@700;800&family=Tajawal:wght@400;500;700&display=swap';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    fetch(`${API}/api/quick-site/stats?tier=${TIER}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(data => setCount(typeof data.count === 'number' ? data.count : 0))
      .catch(() => setFailed(true));
  }, []);

  const clamped = count === null ? null : Math.min(count, CAP);
  const pctFilled = clamped === null ? 0 : (clamped / CAP) * 100;
  const tier = getTier(pctFilled);
  const colors = TIER_COLORS[tier];
  const soldOut = clamped !== null && clamped >= CAP;
  const remaining = clamped === null ? null : Math.max(CAP - clamped, 0);

  const tickerItems = useMemo(
    () => (clamped === null ? [] : buildTickerItems(clamped, copy, remaining)),
    [clamped, remaining, copy]
  );

  const goToOffer = () => {
    if (soldOut) return;
    navigate('/instant?tier=simple');
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ fontFamily: "'Tajawal', sans-serif" }} className="min-h-screen bg-white text-capable-text">
      <div className="flex justify-end px-6 pt-4">
        <LangToggle />
      </div>

      {/* Ticker */}
      {tickerItems.length > 0 && (
        <div className="w-full overflow-hidden bg-capable-navy py-2.5 mt-2">
          <div
            dir="ltr"
            className="flex w-max whitespace-nowrap"
            style={{ animation: 'capable-ticker-scroll 32s linear infinite' }}
          >
            {[0, 1].map(dup => (
              <React.Fragment key={dup}>
                {tickerItems.map((it, i) => (
                  <React.Fragment key={`${dup}-${i}`}>
                    <span className="flex items-center gap-2.5 px-5 text-white text-[13px] font-semibold whitespace-nowrap">
                      {it.icon} {it.text}
                    </span>
                    <span className="flex items-center px-0 text-capable-light/70">•</span>
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
      <style>{`
        @keyframes capable-ticker-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) {
          .capable-cta-pulse { animation: none !important; }
        }
        .capable-cta-pulse { animation: capable-cta-pulse 1.6s ease-in-out infinite; }
        @keyframes capable-cta-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,.45); }
          50% { box-shadow: 0 0 0 10px rgba(239,68,68,0); }
        }
      `}</style>

      <div className="max-w-xl mx-auto px-6 py-10">
        <div
          className="border-[1.5px] border-gray-100 rounded-[18px] px-7 py-8 text-center"
          style={{ boxShadow: '0 20px 50px -25px rgba(31,71,136,.25)' }}
        >
          <span className={`inline-block text-[13px] font-bold px-3.5 py-1.5 rounded-full mb-4 ${colors.badgeBg} ${colors.badgeText}`}>
            {soldOut ? copy.badgeSoldOut : copy.badgeLive}
          </span>

          <div className="font-bold text-capable-navy leading-none" style={{ fontFamily: "'Cairo', sans-serif", fontSize: '52px' }}>
            50
            <small className="block text-base font-medium text-capable-muted mt-1.5">{copy.priceUnit}</small>
          </div>

          <p className="text-[15px] text-capable-text max-w-[420px] mx-auto mt-[18px] mb-5">
            {copy.desc}
          </p>

          <button
            onClick={goToOffer}
            disabled={soldOut}
            className={`inline-block font-bold text-[15px] px-8 py-3.5 rounded-[10px] text-white ${
              soldOut ? 'bg-capable-muted cursor-not-allowed' : `bg-capable-navy hover:opacity-90 ${tier === 'red' ? 'capable-cta-pulse' : ''}`
            }`}
          >
            {soldOut ? copy.ctaSoldOut : copy.ctaLive}
            <small className="block font-medium text-xs opacity-85 mt-0.5">
              {soldOut ? '' : copy.ctaSub}
            </small>
          </button>

          <div className="text-xs text-capable-muted mt-3.5">
            {copy.limitNote}
          </div>

          {clamped !== null && (
            <div className="mt-5" style={{ textAlign: isRTL ? 'right' : 'left' }}>
              <div className="flex items-baseline justify-between text-[13px] mb-2">
                <span>
                  <span className="font-extrabold" style={{ fontFamily: "'Cairo', sans-serif" }}>{clamped}</span>{' '}
                  <span className="text-capable-muted">{copy.ofSeats}</span>
                </span>
                <span className={`font-bold ${colors.text}`}>
                  {soldOut ? copy.complete : copy.remaining(remaining)}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${colors.bar} rounded-full transition-all duration-500`}
                  style={{ width: `${pctFilled}%` }}
                />
              </div>
            </div>
          )}

          {failed && (
            <p className="text-xs text-capable-muted mt-4">{copy.fetchFailedNote}</p>
          )}
        </div>

        <div className="mt-7 bg-capable-surface rounded-2xl px-5 py-5" style={{ textAlign: isRTL ? 'right' : 'left' }}>
          <span className="block text-xs font-bold text-capable-navy mb-2">{copy.missionLabel}</span>
          <p className="text-sm text-capable-text m-0">{copy.missionBody}</p>
        </div>

        <footer className="mt-9 pt-5 border-t border-gray-100 text-center text-xs text-capable-muted">
          {copy.footerLine1}<br />
          {copy.footerCr} <span className="font-bold text-capable-text">{copy.crPlaceholder}</span>
        </footer>
      </div>
    </div>
  );
}
