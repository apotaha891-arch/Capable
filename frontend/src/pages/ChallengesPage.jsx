import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Target, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../i18n/LangContext.jsx';

const GOAL_LABEL = {
  publish_count: { en: 'sites published', ar: 'مواقع منشورة' },
  project_count: { en: 'projects created', ar: 'مشاريع منشأة' },
  generation_count: { en: 'generations', ar: 'عمليات توليد' },
};

function rewardText(ch, ar) {
  const v = Number(ch.reward_value) || 0;
  if (ch.reward_type === 'tokens') return ar ? `${v.toLocaleString()} توكن` : `${v.toLocaleString()} tokens`;
  if (ch.reward_type === 'credit') return ar ? `رصيد $${v}` : `$${v} credit`;
  return ar ? `$${v} نقداً` : `$${v} cash`;
}

export default function ChallengesPage() {
  const { authFetch } = useAuth();
  const { lang, isRTL } = useLang();
  const ar = lang === 'ar';
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const res = await authFetch('/api/challenges');
      const data = await res.json();
      if (res.ok) setChallenges(Array.isArray(data) ? data : []);
    } catch {
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const join = async (id) => {
    setBusyId(id); setMessage('');
    try {
      const res = await authFetch(`/api/challenges/${id}/join`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (ar ? 'تعذّر الانضمام' : 'Failed to join'));
      await load();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const goalLabel = (t) => (GOAL_LABEL[t] || { en: t, ar: t })[ar ? 'ar' : 'en'];

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-950 text-slate-100 px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6">
          <ArrowLeft size={16} className={isRTL ? 'rotate-180' : ''} /> {ar ? 'العودة للوحة التحكم' : 'Back to dashboard'}
        </Link>

        <div className="flex items-center gap-3 text-amber-300 mb-2">
          <Trophy size={22} />
          <h1 className="text-3xl font-bold text-white">{ar ? 'التحديات' : 'Challenges'}</h1>
        </div>
        <p className="text-slate-400 mb-8">{ar ? 'انضمّ إلى تحدٍّ، حقّق الهدف ضمن المدة، واربح الجائزة. لا مخاطرة — المنصة تموّل الجوائز.' : 'Join a challenge, hit the goal within the window, and win the reward. No risk — the platform funds the prizes.'}</p>

        {message && <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{message}</div>}

        {loading ? (
          <div className="text-slate-500">{ar ? 'جارٍ التحميل…' : 'Loading…'}</div>
        ) : challenges.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
            {ar ? 'لا توجد تحدّيات نشطة حالياً. تابعنا قريباً!' : 'No active challenges right now. Check back soon!'}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {challenges.map((ch) => {
              const p = ch.participation;
              const won = p?.status === 'rewarded';
              const expired = p?.status === 'expired';
              const progress = p?.progress || 0;
              const pct = Math.min(100, Math.round((progress / ch.goal_target) * 100));
              return (
                <div key={ch.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-6 flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold text-white">{ch.title}</h2>
                    <span className="shrink-0 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 px-3 py-1 text-xs font-semibold">
                      {rewardText(ch, ar)}
                    </span>
                  </div>
                  {ch.description && <p className="mt-2 text-slate-400 text-sm leading-relaxed">{ch.description}</p>}

                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                    <Target size={14} className="text-indigo-300" />
                    {ar ? `الهدف: ${ch.goal_target} ${goalLabel(ch.goal_type)}` : `Goal: ${ch.goal_target} ${goalLabel(ch.goal_type)}`}
                  </div>
                  {ch.ends_at && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <Clock size={12} /> {ar ? 'ينتهي' : 'Ends'} {new Date(ch.ends_at).toLocaleDateString()}
                    </div>
                  )}

                  {p ? (
                    <div className="mt-4">
                      {won ? (
                        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-emerald-300 text-sm font-semibold">
                          <CheckCircle2 size={16} /> {ar ? `فزت! تم منحك ${rewardText(ch, ar)}` : `You won! ${rewardText(ch, ar)} granted.`}
                        </div>
                      ) : expired ? (
                        <div className="rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3 text-slate-400 text-sm">
                          {ar ? 'انتهى التحدّي قبل إكمال الهدف.' : 'Challenge ended before the goal was met.'}
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>{ar ? 'تقدّمك' : 'Your progress'}</span>
                            <span>{progress} / {ch.goal_target}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => join(ch.id)}
                      disabled={busyId === ch.id}
                      className="mt-5 inline-flex items-center justify-center rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700"
                    >
                      {busyId === ch.id ? (ar ? 'جارٍ الانضمام…' : 'Joining…') : (ar ? 'انضمّ للتحدّي' : 'Join challenge')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
