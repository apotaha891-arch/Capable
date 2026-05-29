import React, { useState, useEffect } from 'react';
import { Search, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner, money, tt } from './AdminShared.jsx';

const PLANS = ['free', 'pro', 'enterprise'];
const ROLES = ['user', 'admin'];

export default function UsersTab({ lang }) {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    authFetch('/api/admin/users').then(r => r.json()).then(setUsers).catch(() => setUsers([]));
  }, []);

  const update = async (id, patch) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...patch } : u));
    await authFetch(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  };

  if (users == null) return <Spinner />;
  const filtered = users.filter(u =>
    !q || u.email?.toLowerCase().includes(q.toLowerCase()) || u.name?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <div className="relative mb-4 max-w-sm">
        <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={q} onChange={e => setQ(e.target.value)}
          placeholder={tt(lang, 'Search users…', 'بحث عن مستخدم…')}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl ps-9 pe-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/50 text-slate-400 text-xs">
            <tr>
              <th className="text-start font-medium px-4 py-3">{tt(lang, 'User', 'المستخدم')}</th>
              <th className="text-start font-medium px-4 py-3">{tt(lang, 'Projects', 'المشاريع')}</th>
              <th className="text-start font-medium px-4 py-3">{tt(lang, 'Revenue', 'الإيراد')}</th>
              <th className="text-start font-medium px-4 py-3">{tt(lang, 'Plan', 'الخطة')}</th>
              <th className="text-start font-medium px-4 py-3">{tt(lang, 'Role', 'الدور')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-slate-800/30">
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{u.name}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                </td>
                <td className="px-4 py-3 text-slate-300">{u.project_count}</td>
                <td className="px-4 py-3 text-emerald-400 font-medium">{money(u.revenue)}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.plan} onChange={e => update(u.id, { plan: e.target.value })}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.role || 'user'} onChange={e => update(u.id, { role: e.target.value })}
                    className={`bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none ${u.role === 'admin' ? 'text-amber-400' : 'text-white'}`}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">{tt(lang, 'No users found.', 'لا يوجد مستخدمون.')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-600 mt-3 flex items-center gap-1.5">
        <Shield size={12} /> {tt(lang, 'Changes save automatically.', 'التغييرات تُحفظ تلقائياً.')}
      </p>
    </div>
  );
}
