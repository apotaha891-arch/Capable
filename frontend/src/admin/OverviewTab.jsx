import React, { useState, useEffect } from 'react';
import { Users, FolderOpen, DollarSign, TrendingUp, Globe, Crown, Eye, Inbox } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { StatCard, Spinner, LineChart, money, tt } from './AdminShared.jsx';

export default function OverviewTab({ lang }) {
  const { authFetch } = useAuth();
  const [d, setD] = useState(null);
  const [traffic, setTraffic] = useState(null);

  useEffect(() => {
    authFetch('/api/admin/overview').then(r => r.json()).then(setD).catch(() => setD(false));
    authFetch('/api/admin/traffic').then(r => r.json()).then(setTraffic).catch(() => setTraffic(false));
  }, []);

  if (d == null) return <Spinner />;
  if (d === false) return <p className="text-slate-400">{tt(lang, 'Failed to load.', 'فشل التحميل.')}</p>;

  const change = d.revenueChangePct;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={<Users size={16} />} tone="indigo"
          label={tt(lang, 'Total Users', 'إجمالي المستخدمين')}
          value={d.users}
          sub={tt(lang, `+${d.newUsersThisMonth} this month`, `+${d.newUsersThisMonth} هذا الشهر`)} />
        <StatCard icon={<DollarSign size={16} />} tone="emerald"
          label={tt(lang, 'MRR', 'الإيراد الشهري المتكرر')}
          value={money(d.mrr)}
          sub={tt(lang, `${d.payingUsers} paying · ARPU ${money(d.arpu)}`, `${d.payingUsers} مدفوع · متوسط ${money(d.arpu)}`)} />
        <StatCard icon={<TrendingUp size={16} />} tone={change >= 0 ? 'emerald' : 'rose'}
          label={tt(lang, 'Revenue (this month)', 'إيراد هذا الشهر')}
          value={money(d.revenueThisMonth)}
          sub={change == null ? '—' : tt(lang, `${change >= 0 ? '+' : ''}${change}% vs last month`, `${change >= 0 ? '+' : ''}${change}% مقارنة بالشهر الماضي`)} />
        <StatCard icon={<FolderOpen size={16} />} tone="cyan"
          label={tt(lang, 'Projects', 'المشاريع')}
          value={d.projects.total}
          sub={tt(lang, `${d.projects.published} live · ${d.projects.public} public`, `${d.projects.published} منشور · ${d.projects.public} عام`)} />
      </div>

      {/* Plan distribution */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Crown size={15} className="text-amber-400" /> {tt(lang, 'Plan Distribution', 'توزيع الخطط')}
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            ['free', tt(lang, 'Free', 'مجاني'), 'text-slate-300'],
            ['pro', 'Pro', 'text-indigo-400'],
            ['enterprise', 'Enterprise', 'text-amber-400'],
          ].map(([k, label, color]) => (
            <div key={k} className="bg-slate-800/50 rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${color}`}>{d.planCounts?.[k] || 0}</div>
              <div className="text-xs text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Visitors & engagement — page views + leads across every published site */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={<Eye size={16} />} tone="indigo"
          label={tt(lang, 'Total Page Views', 'إجمالي المشاهدات')}
          value={traffic ? traffic.totalViews : '…'}
          sub={traffic ? tt(lang, `${traffic.viewsToday} today`, `${traffic.viewsToday} اليوم`) : ''} />
        <StatCard icon={<TrendingUp size={16} />} tone="cyan"
          label={tt(lang, 'Views This Month', 'المشاهدات هذا الشهر')}
          value={traffic ? traffic.viewsThisMonth : '…'}
          sub={traffic ? tt(lang, `across ${traffic.sitesWithTraffic} sites`, `عبر ${traffic.sitesWithTraffic} موقع`) : ''} />
        <StatCard icon={<Inbox size={16} />} tone="emerald"
          label={tt(lang, 'Leads Captured', 'العملاء المحتملون')}
          value={traffic ? traffic.leadsTotal : '…'}
          sub={traffic ? tt(lang, `+${traffic.leadsThisMonth} this month`, `+${traffic.leadsThisMonth} هذا الشهر`) : ''} />
        <StatCard icon={<Globe size={16} />} tone="amber"
          label={tt(lang, 'Sites With Traffic', 'مواقع لديها زيارات')}
          value={traffic ? traffic.sitesWithTraffic : '…'} />
      </div>

      {traffic && traffic.series && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">{tt(lang, 'Visits — last 14 days (all sites)', 'الزيارات — آخر ١٤ يوماً (كل المواقع)')}</h3>
          <LineChart data={traffic.series} />
        </div>
      )}

      {traffic && (traffic.byReferrer?.length > 0 || traffic.byDevice?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">{tt(lang, 'Top Sources', 'أهم المصادر')}</h3>
            {traffic.byReferrer.length === 0 ? <p className="text-sm text-slate-500">{tt(lang, 'No data yet.', 'لا توجد بيانات بعد.')}</p> : (
              <ul className="space-y-2">
                {traffic.byReferrer.map((r, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300 truncate">{r.r}</span>
                    <span className="text-slate-500">{r.c}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">{tt(lang, 'Devices', 'الأجهزة')}</h3>
            {traffic.byDevice.length === 0 ? <p className="text-sm text-slate-500">{tt(lang, 'No data yet.', 'لا توجد بيانات بعد.')}</p> : (
              <div className="space-y-3">
                {traffic.byDevice.map((dev, i) => {
                  const totalDev = traffic.byDevice.reduce((s, x) => s + x.c, 0) || 1;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span className="capitalize">{dev.device}</span><span>{Math.round((dev.c / totalDev) * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${(dev.c / totalDev) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
