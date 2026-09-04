import React, { useState, useEffect, useCallback } from 'react';
import { Megaphone, DollarSign, Eye, MousePointerClick, Target, Percent, Link2, Unlink, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { StatCard, LineChart, Spinner, money, tt } from './AdminShared.jsx';

const PLATFORM_LABEL = {
  meta: { en: 'Meta (Facebook & Instagram)', ar: 'ميتا (فيسبوك وإنستغرام)' },
  tiktok: { en: 'TikTok', ar: 'تيك توك' },
  snapchat: { en: 'Snapchat', ar: 'سناب شات' },
};
const PLATFORMS = ['meta', 'tiktok', 'snapchat'];

const todayStr = (d = new Date()) => d.toISOString().slice(0, 10);

export default function AdsTab({ lang }) {
  const { authFetch } = useAuth();
  const [config, setConfig] = useState(null); // null=unknown, {} once loaded
  const [accounts, setAccounts] = useState(null); // null=loading, false=error, []=loaded
  const [metrics, setMetrics] = useState(null); // null=loading, false=error, {}=loaded
  const [connecting, setConnecting] = useState(null);
  const [disconnecting, setDisconnecting] = useState(null);
  const [range, setRange] = useState({ since: todayStr(new Date(Date.now() - 30 * 24 * 3600 * 1000)), until: todayStr() });
  const [banner, setBanner] = useState(null);

  const loadAccounts = useCallback(() => {
    authFetch('/api/admin/ads/accounts').then((r) => r.json()).then(setAccounts).catch(() => setAccounts(false));
  }, [authFetch]);

  const loadMetrics = useCallback((since, until) => {
    setMetrics(null);
    authFetch(`/api/admin/ads/metrics?since=${since}&until=${until}`).then((r) => r.json()).then(setMetrics).catch(() => setMetrics(false));
  }, [authFetch]);

  useEffect(() => {
    authFetch('/api/admin/ads/config').then((r) => r.json()).then(setConfig).catch(() => setConfig({}));
    loadAccounts();
  }, [authFetch, loadAccounts]);

  useEffect(() => {
    if (!accounts || accounts.length === 0) { setMetrics(accounts === null ? null : { totals: null }); return; }
    loadMetrics(range.since, range.until);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const error = params.get('error');
    if (connected) setBanner({ tone: 'emerald', text: tt(lang, `Connected ${PLATFORM_LABEL[connected]?.en || connected}.`, `تم ربط ${PLATFORM_LABEL[connected]?.ar || connected}.`) });
    else if (error) setBanner({ tone: 'rose', text: tt(lang, 'Connection failed — please try again.', 'فشل الربط — يرجى المحاولة مرة أخرى.') });
    if (connected || error) {
      params.delete('connected'); params.delete('error');
      const qs = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = async (platform) => {
    setConnecting(platform);
    try {
      const res = await authFetch(`/api/admin/ads/connect/${platform}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      window.location.href = data.url;
    } catch (err) {
      setBanner({ tone: 'rose', text: err.message });
      setConnecting(null);
    }
  };

  const disconnect = async (id) => {
    setDisconnecting(id);
    try {
      await authFetch(`/api/admin/ads/accounts/${id}`, { method: 'DELETE' });
      loadAccounts();
    } finally {
      setDisconnecting(null);
    }
  };

  const applyRange = (e) => {
    e.preventDefault();
    loadMetrics(range.since, range.until);
  };

  const hasAccounts = Array.isArray(accounts) && accounts.length > 0;
  const totals = metrics && metrics.totals;
  const campaigns = (metrics?.accounts || []).flatMap((a) =>
    (a.campaigns || []).map((c) => ({ ...c, platform: a.platform, accountName: a.accountName }))
  ).sort((a, b) => b.spend - a.spend);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="bg-fuchsia-500/90 p-1.5 rounded-lg text-slate-900"><Megaphone size={18} /></div>
        <h2 className="text-xl font-bold text-white">{tt(lang, 'Social Ads', 'إعلانات وسائل التواصل')}</h2>
      </div>

      {banner && (
        <div className={`flex items-center justify-between gap-3 border rounded-xl px-4 py-3 text-sm ${
          banner.tone === 'emerald' ? 'border-emerald-700/40 bg-emerald-500/5 text-emerald-300' : 'border-rose-700/40 bg-rose-500/5 text-rose-300'
        }`}>
          <span>{banner.text}</span>
          <button onClick={() => setBanner(null)} className="text-xs opacity-70 hover:opacity-100">{tt(lang, 'Dismiss', 'إغلاق')}</button>
        </div>
      )}

      {/* Connect + connected accounts */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">{tt(lang, 'Connected ad accounts', 'حسابات الإعلانات المرتبطة')}</h3>

        {config == null ? <Spinner /> : (
          <div className="flex flex-wrap gap-2 mb-4">
            {PLATFORMS.filter((p) => config[p]).map((p) => (
              <button key={p} onClick={() => connect(p)} disabled={connecting === p}
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-sm font-medium">
                <Link2 size={14} />
                {connecting === p ? tt(lang, 'Connecting…', 'جارٍ الربط…') : tt(lang, `Connect ${PLATFORM_LABEL[p].en}`, `ربط ${PLATFORM_LABEL[p].ar}`)}
              </button>
            ))}
            {config && PLATFORMS.every((p) => !config[p]) && (
              <p className="text-xs text-slate-500">{tt(lang, 'No ad platforms are configured yet — set the platform credentials on the backend to enable connecting.', 'لا توجد منصات إعلانات مهيأة بعد — أضف بيانات الاعتماد على الخادم لتفعيل الربط.')}</p>
            )}
          </div>
        )}

        {accounts == null ? <Spinner /> : accounts === false ? (
          <p className="text-sm text-slate-500">{tt(lang, 'Failed to load connected accounts.', 'فشل تحميل الحسابات المرتبطة.')}</p>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-slate-500">{tt(lang, 'No ad accounts connected yet.', 'لا توجد حسابات إعلانات مرتبطة بعد.')}</p>
        ) : (
          <div className="space-y-2">
            {accounts.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 bg-slate-800/40 border border-slate-800 rounded-xl px-4 py-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm text-white">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300">{PLATFORM_LABEL[a.platform]?.[lang] || a.platform}</span>
                    <span className="truncate">{a.account_name || a.account_id}</span>
                  </div>
                  {a.last_error && <div className="flex items-center gap-1.5 text-xs text-amber-400 mt-1"><AlertTriangle size={12} /> {a.last_error}</div>}
                </div>
                <button onClick={() => disconnect(a.id)} disabled={disconnecting === a.id}
                  className="shrink-0 inline-flex items-center gap-1.5 text-slate-500 hover:text-rose-400 disabled:opacity-50 text-xs">
                  <Unlink size={13} /> {tt(lang, 'Disconnect', 'فصل')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {!hasAccounts ? null : (
        <>
          {/* Date range */}
          <form onSubmit={applyRange} className="flex flex-wrap items-end gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <label className="text-xs text-slate-400">
              {tt(lang, 'From', 'من')}
              <input type="date" value={range.since} onChange={(e) => setRange((r) => ({ ...r, since: e.target.value }))}
                className="block mt-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white" />
            </label>
            <label className="text-xs text-slate-400">
              {tt(lang, 'To', 'إلى')}
              <input type="date" value={range.until} onChange={(e) => setRange((r) => ({ ...r, until: e.target.value }))}
                className="block mt-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white" />
            </label>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold">
              {tt(lang, 'Apply', 'تطبيق')}
            </button>
          </form>

          {metrics == null ? <Spinner /> : metrics === false ? (
            <p className="text-sm text-slate-500">{tt(lang, 'Failed to load metrics.', 'فشل تحميل المقاييس.')}</p>
          ) : !totals ? <Spinner /> : (
            <>
              {metrics.errors && metrics.errors.length > 0 && (
                <div className="border border-amber-700/40 bg-amber-500/5 rounded-xl px-4 py-3 text-sm text-amber-300 space-y-1">
                  {metrics.errors.map((e, i) => (
                    <div key={i} className="flex items-start gap-2"><AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <span>{PLATFORM_LABEL[e.platform]?.[lang] || e.platform} — {e.accountName}: {e.message}</span></div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                <StatCard icon={<DollarSign size={16} />} tone="emerald" label={tt(lang, 'Spend', 'الإنفاق')} value={money(totals.spend)} />
                <StatCard icon={<Eye size={16} />} tone="indigo" label={tt(lang, 'Impressions', 'مرات الظهور')} value={Math.round(totals.impressions).toLocaleString()} />
                <StatCard icon={<MousePointerClick size={16} />} tone="cyan" label={tt(lang, 'Clicks', 'النقرات')} value={Math.round(totals.clicks).toLocaleString()} />
                <StatCard icon={<Percent size={16} />} tone="amber" label="CTR" value={`${(totals.ctr * 100).toFixed(2)}%`} />
                <StatCard icon={<Target size={16} />} tone="rose" label={tt(lang, 'Conversions', 'التحويلات')} value={Math.round(totals.conversions).toLocaleString()} />
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4">{tt(lang, 'Spend over time', 'الإنفاق عبر الزمن')}</h3>
                <LineChart data={(metrics.series || []).map((s) => ({ label: s.date, views: s.spend }))} color="#f43f5e" />
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4">{tt(lang, 'Campaigns', 'الحملات')}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-slate-400 text-xs">
                      <tr>
                        <th className="text-start font-medium py-2">{tt(lang, 'Platform', 'المنصة')}</th>
                        <th className="text-start font-medium py-2">{tt(lang, 'Account', 'الحساب')}</th>
                        <th className="text-start font-medium py-2">{tt(lang, 'Campaign', 'الحملة')}</th>
                        <th className="text-end font-medium py-2">{tt(lang, 'Spend', 'الإنفاق')}</th>
                        <th className="text-end font-medium py-2">{tt(lang, 'Impressions', 'الظهور')}</th>
                        <th className="text-end font-medium py-2">{tt(lang, 'Clicks', 'النقرات')}</th>
                        <th className="text-end font-medium py-2">CTR</th>
                        <th className="text-end font-medium py-2">{tt(lang, 'Conversions', 'التحويلات')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {campaigns.map((c) => (
                        <tr key={`${c.platform}-${c.id}`}>
                          <td className="py-2"><span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300">{PLATFORM_LABEL[c.platform]?.[lang] || c.platform}</span></td>
                          <td className="py-2 text-slate-400 text-xs">{c.accountName}</td>
                          <td className="py-2 text-slate-300">{c.name}</td>
                          <td className="py-2 text-end font-medium text-white">{money(c.spend)}</td>
                          <td className="py-2 text-end text-slate-400">{Math.round(c.impressions).toLocaleString()}</td>
                          <td className="py-2 text-end text-slate-400">{Math.round(c.clicks).toLocaleString()}</td>
                          <td className="py-2 text-end text-slate-400">{c.impressions > 0 ? `${((c.clicks / c.impressions) * 100).toFixed(2)}%` : '—'}</td>
                          <td className="py-2 text-end text-slate-400">{Math.round(c.conversions).toLocaleString()}</td>
                        </tr>
                      ))}
                      {campaigns.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-slate-500">{tt(lang, 'No campaign data for this range.', 'لا توجد بيانات حملات لهذه الفترة.')}</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
