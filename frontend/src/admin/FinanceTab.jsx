import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, AlertTriangle, Lightbulb, CheckCircle2, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { StatCard, BarChart, Spinner, money, tt } from './AdminShared.jsx';

const SEV = {
  critical: { icon: AlertTriangle, cls: 'border-rose-700/40 bg-rose-500/5 text-rose-300' },
  warning: { icon: AlertTriangle, cls: 'border-amber-700/40 bg-amber-500/5 text-amber-300' },
  positive: { icon: CheckCircle2, cls: 'border-emerald-700/40 bg-emerald-500/5 text-emerald-300' },
  info: { icon: Info, cls: 'border-slate-700 bg-slate-800/40 text-slate-300' },
};

export default function FinanceTab({ lang }) {
  const { authFetch } = useAuth();
  const [d, setD] = useState(null);
  const [txns, setTxns] = useState([]);

  useEffect(() => {
    authFetch('/api/admin/finance').then(r => r.json()).then(setD).catch(() => setD(false));
    authFetch('/api/admin/transactions').then(r => r.json()).then(setTxns).catch(() => setTxns([]));
  }, []);

  if (d == null) return <Spinner />;
  if (d === false) return <p className="text-slate-400">{tt(lang, 'Failed to load.', 'فشل التحميل.')}</p>;

  const chartData = [...d.series, ...d.forecast.projection];
  const runway = d.cash.runwayMonths;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={<Wallet size={16} />} tone="emerald"
          label={tt(lang, 'Cash on hand', 'النقد المتاح')} value={money(d.cash.cash)}
          sub={runway == null ? tt(lang, 'Cash-flow positive', 'تدفق نقدي موجب') : tt(lang, `~${runway} months runway`, `~${runway} أشهر متبقية`)} />
        <StatCard icon={<TrendingUp size={16} />} tone={d.forecast.growthRate >= 0 ? 'emerald' : 'rose'}
          label={tt(lang, 'Monthly growth', 'النمو الشهري')} value={`${d.forecast.growthRate >= 0 ? '+' : ''}${d.forecast.growthRate}%`}
          sub={tt(lang, 'avg MoM (income)', 'متوسط شهري (الدخل)')} />
        <StatCard icon={<TrendingUp size={16} />} tone="indigo"
          label={tt(lang, 'MRR', 'الإيراد المتكرر')} value={money(d.mrr)}
          sub={tt(lang, `ARPU ${money(d.arpu)}`, `متوسط ${money(d.arpu)}`)} />
        <StatCard icon={<Wallet size={16} />} tone="cyan"
          label={tt(lang, 'Revenue mix (mo.)', 'مصادر الإيراد')} value={money(d.bySource.subscription + d.bySource.template_sale)}
          sub={tt(lang, `Subs ${money(d.bySource.subscription)} · Sales ${money(d.bySource.template_sale)}`, `اشتراكات ${money(d.bySource.subscription)} · مبيعات ${money(d.bySource.template_sale)}`)} />
      </div>

      {/* Cashflow + forecast chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">{tt(lang, 'Cashflow & 3-Month Forecast', 'التدفق النقدي وتوقّعات ٣ أشهر')}</h3>
        <BarChart data={chartData} lang={lang} />
      </div>

      {/* Recommendations */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Lightbulb size={15} className="text-amber-400" /> {tt(lang, 'Recommendations', 'التوصيات')}
        </h3>
        <div className="space-y-2.5">
          {d.recommendations.map((r, i) => {
            const s = SEV[r.severity] || SEV.info;
            const Icon = s.icon;
            return (
              <div key={i} className={`flex items-start gap-3 border rounded-xl px-4 py-3 text-sm ${s.cls}`}>
                <Icon size={16} className="shrink-0 mt-0.5" />
                <span>{lang === 'ar' ? r.ar : r.en}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">{tt(lang, 'Recent Transactions', 'أحدث المعاملات')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-400 text-xs">
              <tr>
                <th className="text-start font-medium py-2">{tt(lang, 'Type', 'النوع')}</th>
                <th className="text-start font-medium py-2">{tt(lang, 'Description', 'الوصف')}</th>
                <th className="text-start font-medium py-2">{tt(lang, 'Date', 'التاريخ')}</th>
                <th className="text-end font-medium py-2">{tt(lang, 'Amount', 'المبلغ')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {txns.slice(0, 12).map(t => {
                const isIncome = ['subscription', 'template_sale', 'manual_income'].includes(t.type);
                return (
                  <tr key={t.id}>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{t.type}</span>
                    </td>
                    <td className="py-2 text-slate-300">{t.description || '—'}</td>
                    <td className="py-2 text-slate-500 text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className={`py-2 text-end font-medium ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isIncome ? '+' : '−'}{money(t.amount)}
                    </td>
                  </tr>
                );
              })}
              {txns.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-slate-500">{tt(lang, 'No transactions.', 'لا توجد معاملات.')}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
