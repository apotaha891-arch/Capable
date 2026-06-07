import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Store, Tag, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function MarketplacePage() {
  const { authFetch } = useAuth();
  const [assets, setAssets] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadAssets = async () => {
    try {
      const res = await authFetch('/api/biz/assets');
      const data = await res.json();
      if (res.ok) setAssets(Array.isArray(data) ? data : []);
    } catch {
      setAssets([]);
    }
  };

  useEffect(() => { loadAssets(); }, []);

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('checkout');
    if (c === 'success') setMessage('Payment received — your licensed asset is now available.');
    else if (c === 'cancel') setMessage('Checkout canceled. No charge was made.');
  }, []);

  const buyAsset = async (assetId) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await authFetch(`/api/biz/assets/${assetId}/buy`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Purchase failed');
      if (data.url) { window.location.href = data.url; return; } // Stripe Checkout
      setMessage('Asset purchased. You can now reuse it in your workflow.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300">
                <Store size={16} /> Marketplace
              </div>
              <h1 className="mt-4 text-3xl font-bold text-white">Licensed assets and high-value success recipes</h1>
              <p className="mt-3 text-slate-400 max-w-2xl leading-relaxed">
                Browse proven templates, workflows, and launch bundles you can apply directly to your project.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-800 border border-slate-700 p-6 text-right">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-500">How it works</div>
              <div className="mt-2 text-sm text-slate-300">Buy reusable business assets, then apply them to your projects as ready-made value modules.</div>
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {assets.map((asset) => (
              <div key={asset.id} className="rounded-3xl border border-slate-800 bg-slate-950 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-400 uppercase tracking-[0.3em]">
                    <Tag size={14} /> {asset.slug}
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-white">{asset.title}</h2>
                  <p className="mt-3 text-slate-400 text-sm leading-relaxed">{asset.description}</p>
                </div>
                <div className="mt-6 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Price</div>
                    <div className="text-xl font-semibold text-white">${asset.price}</div>
                  </div>
                  <button
                    onClick={() => buyAsset(asset.id)}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700"
                  >
                    <Sparkles size={16} /> Buy
                  </button>
                </div>
              </div>
            ))}
          </div>

          {message && <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">{message}</div>}
        </div>
      </div>
    </div>
  );
}
