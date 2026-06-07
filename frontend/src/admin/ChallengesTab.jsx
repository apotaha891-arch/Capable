import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Trash2, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner, tt } from './AdminShared.jsx';

const GOALS = (lang) => [
  ['generation_count', tt(lang, 'Generations', 'عمليات توليد')],
  ['publish_count', tt(lang, 'Sites published', 'مواقع منشورة')],
  ['project_count', tt(lang, 'Projects created', 'مشاريع منشأة')],
];
const REWARDS = (lang) => [
  ['tokens', tt(lang, 'Bonus tokens', 'توكنات إضافية')],
  ['credit', tt(lang, 'Account credit ($)', 'رصيد على الحساب ($)')],
  ['cash', tt(lang, 'Cash prize ($)', 'جائزة نقدية ($)')],
];

export default function ChallengesTab({ lang }) {
  const { authFetch } = useAuth();
  const [list, setList] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', goal_type: 'generation_count', goal_target: 5,
    reward_type: 'tokens', reward_value: 500000, ends_at: '',
  });

  const load = async () => {
    try {
      const res = await authFetch('/api/admin/challenges');
      const data = await res.json();
      setList(res.ok && Array.isArray(data) ? data : []);
    } catch { setList([]); }
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg('');
    try {
      const res = await authFetch('/api/admin/challenges', { method: 'POST', body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setForm({ ...form, title: '', description: '' });
      await load();
      setMsg(tt(lang, 'Challenge created.', 'تم إنشاء التحدّي.'));
    } catch (err) { setMsg(err.message); }
    finally { setBusy(false); }
  };

  const remove = async (id) => {
    if (!window.confirm(tt(lang, 'Delete this challenge?', 'حذف هذا التحدّي؟'))) return;
    await authFetch(`/api/admin/challenges/${id}`, { method: 'DELETE' });
    await load();
  };

  const rewardLabel = (c) => {
    const v = Number(c.reward_value) || 0;
    if (c.reward_type === 'tokens') return tt(lang, `${v.toLocaleString()} tokens`, `${v.toLocaleString()} توكن`);
    if (c.reward_type === 'credit') return `$${v} ${tt(lang, 'credit', 'رصيد')}`;
    return `$${v} ${tt(lang, 'cash', 'نقد')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="bg-amber-500/90 p-1.5 rounded-lg text-slate-900"><Trophy size={18} /></div>
        <h2 className="text-xl font-bold text-white">{tt(lang, 'Challenges', 'التحديات')}</h2>
      </div>

      {/* Create form */}
      <form onSubmit={create} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-slate-300 sm:col-span-2">{tt(lang, 'Title', 'العنوان')}
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
        </label>
        <label className="text-sm text-slate-300 sm:col-span-2">{tt(lang, 'Description', 'الوصف')}
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white min-h-[60px]" />
        </label>
        <label className="text-sm text-slate-300">{tt(lang, 'Goal metric', 'مقياس الهدف')}
          <select value={form.goal_type} onChange={e => setForm({ ...form, goal_type: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
            {GOALS(lang).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="text-sm text-slate-300">{tt(lang, 'Goal target', 'قيمة الهدف')}
          <input type="number" min="1" value={form.goal_target} onChange={e => setForm({ ...form, goal_target: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
        </label>
        <label className="text-sm text-slate-300">{tt(lang, 'Reward type', 'نوع الجائزة')}
          <select value={form.reward_type} onChange={e => setForm({ ...form, reward_type: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
            {REWARDS(lang).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="text-sm text-slate-300">{tt(lang, 'Reward value', 'قيمة الجائزة')}
          <input type="number" min="0" value={form.reward_value} onChange={e => setForm({ ...form, reward_value: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
        </label>
        <label className="text-sm text-slate-300 sm:col-span-2">{tt(lang, 'Ends at (optional)', 'ينتهي في (اختياري)')}
          <input type="date" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
        </label>
        <div className="sm:col-span-2 flex items-center gap-3">
          <button type="submit" disabled={busy}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold">
            <Plus size={15} /> {tt(lang, 'Create challenge', 'إنشاء تحدٍّ')}
          </button>
          {msg && <span className="text-sm text-slate-400">{msg}</span>}
        </div>
      </form>

      {/* List */}
      {list === null ? <Spinner /> : list.length === 0 ? (
        <div className="text-slate-500 text-sm">{tt(lang, 'No challenges yet.', 'لا توجد تحدّيات بعد.')}</div>
      ) : (
        <div className="space-y-3">
          {list.map((c) => (
            <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-semibold text-white truncate">{c.title}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {tt(lang, 'Goal', 'الهدف')}: {c.goal_target} · {tt(lang, 'Reward', 'الجائزة')}: {rewardLabel(c)} · {c.status}
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-xs text-slate-400 flex items-center gap-1"><Users size={13} /> {c.participants} · 🏆 {c.winners}</span>
                <button onClick={() => remove(c.id)} className="text-slate-400 hover:text-red-400" title={tt(lang, 'Delete', 'حذف')}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
