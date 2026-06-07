import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Shield, Zap, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function InfluencePage() {
  const { user, authFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resonance, setResonance] = useState(null);

  const loadResonance = useCallback(async () => {
    if (!user) return;
    try {
      const res = await authFetch('/api/biz/resonance');
      const data = await res.json();
      if (res.ok) setResonance(data);
    } catch {
      /* non-fatal: resonance is informational */
    }
  }, [user, authFetch]);

  useEffect(() => { loadResonance(); }, [loadResonance]);

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('checkout');
    if (c === 'success') setMessage('Payment received — your Influence Pass is activating and will reflect shortly.');
    else if (c === 'cancel') setMessage('Checkout canceled. No charge was made.');
  }, []);

  const subscribe = async () => {
    if (!user) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await authFetch('/api/biz/subscribe', {
        method: 'POST',
        body: JSON.stringify({ plan: 'influence' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to subscribe');
      if (data.url) { window.location.href = data.url; return; } // Stripe Checkout
      setMessage('Your Influence Pass is active — you now have control access to new premium features.');
      loadResonance();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const manageBilling = async () => {
    try {
      const res = await authFetch('/api/biz/portal', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Billing portal unavailable');
      window.location.href = data.url;
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-lg shadow-slate-900/20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-300">
                <Sparkles size={16} /> Influence Pass
              </div>
              <h1 className="mt-4 text-3xl font-bold text-white">Own the outcome of your experience</h1>
              <p className="mt-3 text-slate-400 max-w-2xl leading-relaxed">
                Upgrade to the Influence Pass so your account earns access, personalization, and early feature control.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-800 border border-slate-700 p-6 w-full lg:w-auto">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Current plan</div>
              <div className="mt-2 text-3xl font-bold text-white">{user?.plan || 'free'}</div>
              <div className="mt-4 text-sm text-slate-400">Unlock influence on product decisions, faster experiments, and priority support.</div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {[
              { icon: Sparkles, title: 'Early access', description: 'Get new features before public release and help steer the roadmap.' },
              { icon: Shield, title: 'Priority control', description: 'Choose which workflows you want the system to optimize for first.' },
              { icon: Zap, title: 'Fast adaptation', description: 'Your usage data is weighted for faster personalization and feature tuning.' },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                <div className="h-11 w-11 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-indigo-300 mb-4">
                  <item.icon size={20} />
                </div>
                <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                <p className="mt-3 text-slate-400 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          {resonance && (
            <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">
                  <Activity size={16} /> Your resonance
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{Number(resonance.score).toFixed(1)}</div>
                  <div className="text-xs text-slate-500">{resonance.events} influence events</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                Resonance is a 30-day weighted measure of how much you shape the platform. Higher resonance gives
                your votes, experiments, and pricing a stronger pull.
              </p>
              {resonance.breakdown?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {resonance.breakdown.map((b) => (
                    <span key={b.event_type} className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300">
                      {b.event_type.replace(/_/g, ' ')} · {b.count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto] items-center">
            <div>
              <p className="text-slate-400">The Influence Pass is designed to let paying users shape the platform direction and gain earlier, better outcomes.</p>
            </div>
            <div className="flex flex-wrap gap-3 justify-end">
              {(user?.plan === 'influence' || user?.plan === 'pro') && (
                <button
                  onClick={manageBilling}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                >
                  Manage billing
                </button>
              )}
              <button
                onClick={subscribe}
                disabled={loading || user?.plan === 'influence'}
                className="inline-flex items-center justify-center rounded-2xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700"
              >
                {user?.plan === 'influence' ? 'Influence Pass active' : 'Activate Influence Pass'}
              </button>
            </div>
          </div>

          {message && (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
