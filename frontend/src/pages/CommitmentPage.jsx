import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Target, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../i18n/LangContext.jsx';

const STATUS_LABEL = {
  active: { en: 'active', ar: 'نشط' },
  completed: { en: 'completed', ar: 'مكتمل' },
  failed: { en: 'failed', ar: 'فشل' },
};

export default function CommitmentPage() {
  const { authFetch } = useAuth();
  const { lang, isRTL } = useLang();
  const ar = lang === 'ar';
  const [commitments, setCommitments] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', stake_amount: '25', reward_amount: '50', target_date: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadCommitments = async () => {
    try {
      const res = await authFetch('/api/biz/commitments');
      const data = await res.json();
      if (res.ok) setCommitments(Array.isArray(data) ? data : []);
    } catch {
      setCommitments([]);
    }
  };

  useEffect(() => { loadCommitments(); }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await authFetch('/api/biz/commitments', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (ar ? 'تعذّر إنشاء الالتزام' : 'Could not create commitment'));
      setCommitments((prev) => [data.commitment, ...prev]);
      setForm({ title: '', description: '', stake_amount: '25', reward_amount: '50', target_date: '' });
      setMessage(ar ? 'تم إنشاء الالتزام. تابعه هنا وأكمله عند الجاهزية.' : 'Commitment created. Track it here and complete it when ready.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const completeCommitment = async (commitmentId) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await authFetch(`/api/biz/commitments/${commitmentId}/complete`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (ar ? 'تعذّر إكمال الالتزام' : 'Failed to complete commitment'));
      setCommitments((prev) => prev.map((item) => item.id === commitmentId ? { ...item, status: 'completed', completed_at: data.completed_at } : item));
      setMessage(ar ? 'تم وضع علامة اكتمال — وتسجيل المكافأة.' : 'Commitment marked complete — reward recorded.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = (s) => (STATUS_LABEL[s] || { en: s, ar: s })[ar ? 'ar' : 'en'];

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-950 text-slate-100 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6">
          <ArrowLeft size={16} className={isRTL ? 'rotate-180' : ''} /> {ar ? 'العودة للوحة التحكم' : 'Back to dashboard'}
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900 p-8">
            <div className="flex items-center gap-3 text-indigo-300">
              <Target size={20} />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{ar ? 'خزنة الالتزام' : 'Commitment Vault'}</p>
                <h1 className="text-3xl font-bold text-white">{ar ? 'راهِن على أهدافك واحصد المكافأة' : 'Stake goals and earn the upside'}</h1>
              </div>
            </div>
            <p className="text-slate-400 leading-relaxed">{ar ? 'أنشئ التزاماً سلوكياً، وثبّت مكافأة، وتابع الإنجاز. نجاحك يصبح ميزة في المنتج ومصدر دخل.' : 'Create a behavior commitment, lock in a reward, and track completion. Your success becomes a product feature and revenue source.'}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-slate-300">
                  {ar ? 'العنوان' : 'Title'}
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                    placeholder={ar ? 'أطلق موقعاً هذا الأسبوع' : 'Launch a site this week'}
                    required
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  {ar ? 'التاريخ المستهدف' : 'Target date'}
                  <input
                    type="date"
                    value={form.target_date}
                    onChange={(e) => setForm({ ...form, target_date: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                    required
                  />
                </label>
              </div>

              <label className="block text-sm text-slate-300">
                {ar ? 'الوصف' : 'Description'}
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-2 w-full min-h-[120px] rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                  placeholder={ar ? 'أنشئ صفحة هبوط وانشرها مباشرة.' : 'Create a billboard landing page and publish it live.'}
                  required
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-slate-300">
                  {ar ? 'مبلغ المراهنة ($)' : 'Stake amount ($)'}
                  <input
                    type="number"
                    min="1"
                    value={form.stake_amount}
                    onChange={(e) => setForm({ ...form, stake_amount: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                    required
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  {ar ? 'مبلغ المكافأة ($)' : 'Reward amount ($)'}
                  <input
                    type="number"
                    min="1"
                    value={form.reward_amount}
                    onChange={(e) => setForm({ ...form, reward_amount: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                    required
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700"
              >
                {ar ? 'إنشاء التزام' : 'Create commitment'}
              </button>
            </form>

            {message && <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">{message}</div>}
          </section>

          <section className="space-y-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <h2 className="text-xl font-semibold text-white">{ar ? 'التزاماتك' : 'Your commitments'}</h2>
              </div>
              <p className="mt-2 text-slate-400 text-sm">{ar ? 'تابع وأكمل وكافئ الأهداف السلوكية الناجحة.' : 'Track, complete, and reward successful behavior-based goals.'}</p>
            </div>

            <div className="space-y-4">
              {commitments.length === 0 ? (
                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">{ar ? 'لا توجد التزامات بعد. أنشئ واحداً من النموذج.' : 'No commitments yet. Create one from the form.'}</div>
              ) : commitments.map((commitment) => (
                <div key={commitment.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm text-slate-500 uppercase tracking-[0.2em]">{statusLabel(commitment.status)}</div>
                      <h3 className="mt-2 text-lg font-semibold text-white">{commitment.title}</h3>
                      <p className="mt-2 text-slate-400 text-sm leading-relaxed">{commitment.description}</p>
                    </div>
                    <div className={isRTL ? 'text-left' : 'text-right'}>
                      <div className="text-sm text-slate-500">{ar ? 'المراهنة' : 'Stake'}</div>
                      <div className="text-lg font-semibold text-white">${commitment.stake_amount}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
                    <span>{ar ? 'مكافأة' : 'Reward'} ${commitment.reward_amount}</span>
                    <span>{ar ? 'المستهدف' : 'Target'} {commitment.target_date || (ar ? 'غير محدد' : 'TBD')}</span>
                    {commitment.status === 'active' && (
                      <button
                        onClick={() => completeCommitment(commitment.id)}
                        disabled={loading}
                        className="rounded-full bg-emerald-500/10 px-4 py-2 text-emerald-300 text-xs font-semibold transition hover:bg-emerald-500/20 disabled:cursor-not-allowed"
                      >
                        {ar ? 'وضع علامة اكتمال' : 'Mark complete'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
