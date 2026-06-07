import React, { useState, useEffect } from 'react';
import { Boxes, Recycle, BarChart3, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner, tt } from './AdminShared.jsx';

export default function EcosystemTab({ lang }) {
  const { authFetch } = useAuth();
  const [fund, setFund] = useState(null);
  const [insights, setInsights] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const [f, i] = await Promise.all([
        authFetch('/api/admin/adaptive-fund').then((r) => r.json()),
        authFetch('/api/biz/insights').then((r) => r.json()),
      ]);
      setFund(f); setInsights(i);
    } catch { setFund({ balance: 0, entries: [] }); }
  };
  useEffect(() => { load(); }, []);

  const reallocate = async () => {
    if (!window.confirm(tt(lang, 'Distribute the whole fund to top-resonance users now?', 'توزيع كامل الصندوق على أعلى المستخدمين صدىً الآن؟'))) return;
    setBusy(true); setMsg('');
    try {
      const res = await authFetch('/api/admin/adaptive-fund/reallocate', { method: 'POST', body: JSON.stringify({ top: 5 }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMsg(tt(lang, `Distributed $${data.distributed} to ${data.recipients.length} users.`, `وُزِّع $${data.distributed} على ${data.recipients.length} مستخدمين.`));
      await load();
    } catch (err) { setMsg(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="bg-emerald-500/90 p-1.5 rounded-lg text-slate-900"><Boxes size={18} /></div>
        <h2 className="text-xl font-bold text-white">{tt(lang, 'Ecosystem & Adaptive Fund', 'النظام البيئي والصندوق التكيّفي')}</h2>
      </div>

      {/* Fund */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{tt(lang, 'Adaptive fund balance', 'رصيد الصندوق التكيّفي')}</div>
            <div className="mt-1 text-3xl font-bold text-white">{fund ? `$${Number(fund.balance).toFixed(2)}` : '…'}</div>
            <p className="mt-1 text-xs text-slate-500 max-w-md">{tt(lang, '10% of platform revenue accrues here, then is reinvested into the highest-resonance users (partners weighted 1.5×).', '١٠٪ من إيراد المنصة يتجمّع هنا ثم يُعاد استثماره في أعلى المستخدمين صدىً (الشركاء بوزن ١.٥×).')}</p>
          </div>
          <button onClick={reallocate} disabled={busy || !fund || fund.balance <= 0}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold">
            <Recycle size={16} /> {tt(lang, 'Reallocate now', 'أعد التوزيع الآن')}
          </button>
        </div>
        {msg && <div className="mt-3 text-sm text-emerald-300">{msg}</div>}
      </div>

      {/* Insights */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-slate-300 mb-3"><BarChart3 size={15} /> <span className="font-semibold">{tt(lang, 'Influence by type', 'التأثير حسب النوع')}</span></div>
          {!insights ? <Spinner /> : (insights.events_by_type || []).length === 0 ? (
            <div className="text-sm text-slate-500">{tt(lang, 'No data yet.', 'لا بيانات بعد.')}</div>
          ) : (
            <div className="space-y-1.5">
              {insights.events_by_type.map((e) => (
                <div key={e.event_type} className="flex justify-between text-sm">
                  <span className="text-slate-400">{e.event_type.replace(/_/g, ' ')}</span>
                  <span className="text-slate-300">{e.count} · {Number(e.weight).toFixed(0)}w</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-slate-300 mb-3"><Flame size={15} /> <span className="font-semibold">{tt(lang, 'Top modules (fitness)', 'أعلى الوحدات (لياقة)')}</span></div>
          {!insights ? <Spinner /> : (insights.top_modules || []).length === 0 ? (
            <div className="text-sm text-slate-500">{tt(lang, 'No modules yet.', 'لا وحدات بعد.')}</div>
          ) : (
            <div className="space-y-1.5">
              {insights.top_modules.map((m, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-slate-400 truncate">{m.title}</span>
                  <span className="text-amber-300">🔥 {m.adoption_count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
