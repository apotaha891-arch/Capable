import React, { useState, useEffect } from 'react';
import { Search, Loader, ShoppingCart } from 'lucide-react';
import { tt } from '../admin/AdminShared.jsx';

// Search, buy, and auto-connect a new domain without leaving Capable — no
// external registrar redirect. Renders nothing until a mount probe confirms
// the backend has ResellerClub credentials configured, so it's invisible
// (not half-broken, and never names a registrar we don't actually use) while
// that integration isn't set up yet.
export default function DomainSearchBuy({ projectId, authFetch, lang, canPremium }) {
  const [configured, setConfigured] = useState(null); // null = unknown yet
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [buying, setBuying] = useState(null);
  const [showRegistrant, setShowRegistrant] = useState(null);
  const [registrant, setRegistrant] = useState({ name: '', email: '', phone: '', phoneCc: '', country: '', city: '', address: '', zipcode: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!canPremium) { setConfigured(false); return; }
    authFetch('/api/domains/search?q=capable-probe').then(r => r.json())
      .then(d => setConfigured(!!d.configured)).catch(() => setConfigured(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canPremium]);

  const search = async (e) => {
    e.preventDefault();
    const name = q.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\.[a-z]+.*$/, '');
    if (!name) return;
    setSearching(true); setError(''); setResults(null);
    try {
      const res = await authFetch(`/api/domains/search?q=${encodeURIComponent(name)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setResults(data.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const submitPurchase = async (e) => {
    e.preventDefault();
    setBuying(showRegistrant);
    setError('');
    try {
      const res = await authFetch('/api/domains/purchase', {
        method: 'POST',
        body: JSON.stringify({ project_id: projectId, domain: showRegistrant, registrant }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setBuying(null);
    }
  };

  if (!configured) return null;

  const rField = (key, placeholder, extra = '') => (
    <input required placeholder={placeholder} value={registrant[key]}
      onChange={e => setRegistrant(r => ({ ...r, [key]: e.target.value }))}
      className={`bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none ${extra}`} />
  );

  return (
    <div className="border-t border-slate-800 pt-4">
      <span className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
        {tt(lang, 'Buy a new domain', 'اشترِ نطاقاً جديداً')}
      </span>
      <p className="text-[11px] text-slate-600 mt-1 mb-2">
        {tt(lang, 'Search, buy, and connect a domain without leaving Capable.', 'ابحث واشترِ واربط نطاقاً بدون مغادرة كيبابل.')}
      </p>
      <form onSubmit={search} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-500" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={tt(lang, 'yourstore', 'متجرك')}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl ps-9 pe-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
        </div>
        <button type="submit" disabled={searching || !q.trim()} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-60">
          {searching ? <Loader className="animate-spin" size={14} /> : tt(lang, 'Search', 'بحث')}
        </button>
      </form>

      {results && (
        <div className="mt-3 space-y-1.5">
          {results.map(r => (
            <div key={r.domain} className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm">
              <span className={r.available ? 'text-white' : 'text-slate-500 line-through'}>{r.domain}</span>
              {r.available ? (
                <button type="button" onClick={() => { setShowRegistrant(r.domain); setError(''); }}
                  className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs font-semibold">
                  <ShoppingCart size={12} /> ${r.price}/{tt(lang, 'yr', 'سنة')}
                </button>
              ) : (
                <span className="text-[11px] text-slate-500">{tt(lang, 'Taken', 'محجوز')}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {showRegistrant && (
        <form onSubmit={submitPurchase} className="mt-3 space-y-2 bg-slate-950/50 border border-slate-800 rounded-xl p-3">
          <p className="text-xs text-slate-400">
            {tt(lang, `Registrant details for ${showRegistrant} (required by domain registries):`, `بيانات مالك النطاق ${showRegistrant} (مطلوبة من مسجّلات النطاقات):`)}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {rField('name', tt(lang, 'Full name', 'الاسم الكامل'), 'col-span-2')}
            {rField('email', tt(lang, 'Email', 'البريد الإلكتروني'), 'col-span-2')}
            {rField('phoneCc', tt(lang, 'Country code (e.g. 966)', 'مفتاح الدولة (مثال 966)'))}
            {rField('phone', tt(lang, 'Phone number', 'رقم الجوال'))}
            {rField('country', tt(lang, 'Country (ISO, e.g. SA)', 'رمز الدولة (مثال SA)'))}
            {rField('city', tt(lang, 'City', 'المدينة'))}
            {rField('address', tt(lang, 'Address', 'العنوان'), 'col-span-2')}
            {rField('zipcode', tt(lang, 'ZIP / postal code', 'الرمز البريدي'), 'col-span-2')}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button type="submit" disabled={buying === showRegistrant}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-semibold">
              {buying === showRegistrant ? tt(lang, 'Redirecting…', 'جارٍ التحويل…') : tt(lang, 'Continue to payment', 'المتابعة للدفع')}
            </button>
            <button type="button" onClick={() => setShowRegistrant(null)} className="text-slate-400 hover:text-white text-xs">
              {tt(lang, 'Cancel', 'إلغاء')}
            </button>
          </div>
        </form>
      )}

      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}
