import React, { useState, useEffect } from 'react';
import { Users, FolderOpen, DollarSign, TrendingUp, Globe, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { StatCard, Spinner, money, tt } from './AdminShared.jsx';

export default function OverviewTab({ lang }) {
  const { authFetch } = useAuth();
  const [d, setD] = useState(null);

  useEffect(() => {
    authFetch('/api/admin/overview').then(r => r.json()).then(setD).catch(() => setD(false));
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
    </div>
  );
}
