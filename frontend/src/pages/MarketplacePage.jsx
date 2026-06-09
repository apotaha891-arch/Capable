import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Store, Tag, Sparkles, Flame, Plus, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../i18n/LangContext.jsx';

export default function MarketplacePage() {
  const { authFetch } = useAuth();
  const { lang, isRTL } = useLang();
  const ar = lang === 'ar';
  const [assets, setAssets] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [myProjects, setMyProjects] = useState([]);
  const [showList, setShowList] = useState(false);
  const [listForm, setListForm] = useState({ project_id: '', title: '', description: '', price: '0' });

  const loadAssets = async () => {
    try {
      const res = await authFetch('/api/biz/assets');
      const data = await res.json();
      if (res.ok) setAssets(Array.isArray(data) ? data : []);
    } catch {
      setAssets([]);
    }
  };

  const loadProjects = async () => {
    try {
      const res = await authFetch('/api/projects');
      const data = await res.json();
      if (res.ok) setMyProjects(Array.isArray(data) ? data : []);
    } catch { /* optional */ }
  };

  useEffect(() => { loadAssets(); loadProjects(); }, []);

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('checkout');
    if (c === 'success') setMessage(ar ? 'تم استلام الدفع — أصبح الأصل المرخّص متاحاً لك (نُسخت نسخة إلى مشاريعك).' : 'Payment received — your licensed module is now available (a copy was added to your projects).');
    else if (c === 'cancel') setMessage(ar ? 'تم إلغاء الدفع. لم يتم خصم أي مبلغ.' : 'Checkout canceled. No charge was made.');
  }, [ar]);

  const buyAsset = async (assetId) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await authFetch(`/api/biz/assets/${assetId}/buy`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (ar ? 'فشل الشراء' : 'Purchase failed'));
      if (data.url) { window.location.href = data.url; return; } // Stripe Checkout
      setMessage(
        data.cloned_project_id
          ? (ar ? 'تم! أُضيفت نسخة من الوحدة إلى مشاريعك.' : 'Done! A copy of the module was added to your projects.')
          : (ar ? 'تم شراء الأصل.' : 'Asset purchased.')
      );
      loadAssets();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const listModule = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage('');
    try {
      const res = await authFetch('/api/biz/assets', { method: 'POST', body: JSON.stringify(listForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (ar ? 'تعذّر النشر' : 'Failed to list'));
      setShowList(false);
      setListForm({ project_id: '', title: '', description: '', price: '0' });
      setMessage(ar ? 'تم نشر وحدتك في المتجر.' : 'Your module is now listed.');
      loadAssets();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-950 text-slate-100 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6">
          <ArrowLeft size={16} className={isRTL ? 'rotate-180' : ''} /> {ar ? 'العودة للوحة التحكم' : 'Back to dashboard'}
        </Link>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300">
                <Store size={16} /> {ar ? 'المتجر' : 'Marketplace'}
              </div>
              <h1 className="mt-4 text-3xl font-bold text-white">{ar ? 'وحدات مرخّصة من صنع المجتمع' : 'Licensed modules from the community'}</h1>
              <p className="mt-3 text-slate-400 max-w-2xl leading-relaxed">
                {ar ? 'تبنَّ وحدات مُجرّبة من منشئين آخرين — تُنسخ مباشرة إلى مشاريعك. أو انشر مشروعك واكسب من كل تبنٍّ.' : 'Adopt proven modules from other creators — copied straight into your projects. Or list your own and earn on every adoption.'}
              </p>
            </div>
            <button
              onClick={() => setShowList((s) => !s)}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 self-start"
            >
              <Plus size={16} /> {ar ? 'انشر مشروعك' : 'List a project'}
            </button>
          </div>

          {showList && (
            <form onSubmit={listModule} className="mt-6 rounded-3xl border border-indigo-700/40 bg-indigo-900/10 p-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-slate-300 sm:col-span-2">{ar ? 'اختر مشروعاً' : 'Choose a project'}
                <select required value={listForm.project_id} onChange={(e) => setListForm({ ...listForm, project_id: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
                  <option value="">{ar ? '— اختر —' : '— select —'}</option>
                  {myProjects.map((p) => <option key={p.id} value={p.id}>{p.name || `#${p.id}`}</option>)}
                </select>
              </label>
              <label className="text-sm text-slate-300">{ar ? 'عنوان الوحدة' : 'Module title'}
                <input required value={listForm.title} onChange={(e) => setListForm({ ...listForm, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
              </label>
              <label className="text-sm text-slate-300">{ar ? 'السعر ($) — صفر = مجاني' : 'Price ($) — 0 = free'}
                <input type="number" min="0" value={listForm.price} onChange={(e) => setListForm({ ...listForm, price: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
              </label>
              <label className="text-sm text-slate-300 sm:col-span-2">{ar ? 'الوصف' : 'Description'}
                <textarea value={listForm.description} onChange={(e) => setListForm({ ...listForm, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white min-h-[60px]" />
              </label>
              <div className="sm:col-span-2 text-xs text-slate-400">
                {ar ? `تكسب ٧٠٪ من كل عملية بيع كرصيد على حسابك.` : `You earn 70% of each sale as account credit.`}
              </div>
              <button type="submit" disabled={loading} className="sm:col-span-2 rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:bg-slate-700">
                {ar ? 'نشر في المتجر' : 'Publish to marketplace'}
              </button>
            </form>
          )}

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {assets.map((asset) => {
              // Prefer Arabic title/description from metadata when the UI is in
              // Arabic; fall back to the stored (creator-language) content.
              const title = (ar && asset.metadata?.title_ar) || asset.title;
              const description = (ar && asset.metadata?.description_ar) || asset.description;
              return (
              <div key={asset.id} className="rounded-3xl border border-slate-800 bg-slate-950 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-[0.2em]">
                      <Tag size={13} /> {asset.slug}
                    </div>
                    {asset.adoption_count > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-xs font-semibold">
                        <Flame size={12} /> {asset.adoption_count}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-white">{title}</h2>
                  {asset.creator_name && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <User size={11} /> {ar ? 'بواسطة' : 'by'} {asset.creator_name}
                    </div>
                  )}
                  <p className="mt-3 text-slate-400 text-sm leading-relaxed">{description}</p>
                </div>
                <div className="mt-6 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.3em] text-slate-500">{ar ? 'السعر' : 'Price'}</div>
                    <div className="text-xl font-semibold text-white">{asset.price > 0 ? `$${asset.price}` : (ar ? 'مجاني' : 'Free')}</div>
                  </div>
                  <button
                    onClick={() => buyAsset(asset.id)}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700"
                  >
                    <Sparkles size={16} /> {asset.project_id ? (ar ? 'تبنَّ' : 'Adopt') : (ar ? 'شراء' : 'Buy')}
                  </button>
                </div>
              </div>
              );
            })}
          </div>

          {message && <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">{message}</div>}
        </div>
      </div>
    </div>
  );
}
