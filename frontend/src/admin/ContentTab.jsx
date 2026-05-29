import React, { useState, useEffect } from 'react';
import { Search, Trash2, Star, Globe, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner, Toggle, tt } from './AdminShared.jsx';

export default function ContentTab({ lang }) {
  const { authFetch } = useAuth();
  const [projects, setProjects] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    authFetch('/api/admin/projects').then(r => r.json()).then(setProjects).catch(() => setProjects([]));
  }, []);

  const patch = async (id, body) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...body } : p));
    await authFetch(`/api/admin/projects/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  };

  const savePrice = async (id, price) => {
    const val = Math.max(0, parseInt(price, 10) || 0);
    await patch(id, { price: val });
  };

  const remove = async (id) => {
    if (!window.confirm(tt(lang, 'Delete this project permanently?', 'حذف هذا المشروع نهائياً؟'))) return;
    setProjects(prev => prev.filter(p => p.id !== id));
    await authFetch(`/api/admin/projects/${id}`, { method: 'DELETE' });
  };

  if (projects == null) return <Spinner />;
  const filtered = projects.filter(p =>
    !q || p.name?.toLowerCase().includes(q.toLowerCase()) || p.author_email?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <div className="relative mb-4 max-w-sm">
        <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={q} onChange={e => setQ(e.target.value)}
          placeholder={tt(lang, 'Search projects…', 'بحث عن مشروع…')}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl ps-9 pe-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(p => (
          <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-4">
            <div className="w-24 h-16 rounded-lg bg-slate-800 overflow-hidden shrink-0">
              {p.thumbnail_url
                ? <img src={p.thumbnail_url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">—</div>}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate">{p.name}</div>
                  <div className="text-xs text-slate-500 truncate">{p.author_email || '—'}</div>
                </div>
                <button onClick={() => remove(p.id)} title={tt(lang, 'Delete', 'حذف')}
                  className="text-slate-500 hover:text-red-400 shrink-0"><Trash2 size={15} /></button>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs">
                {/* Price */}
                <label className="flex items-center gap-1.5 text-slate-400">
                  <span>{tt(lang, 'Price $', 'السعر $')}</span>
                  <input
                    type="number" min="0" defaultValue={p.price}
                    onBlur={e => savePrice(p.id, e.target.value)}
                    className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </label>
                {/* Public */}
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Eye size={13} /> {tt(lang, 'Public', 'عام')}
                  <Toggle checked={!!p.is_public} onChange={v => patch(p.id, { is_public: v })} />
                </span>
                {/* Published */}
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Globe size={13} /> {tt(lang, 'Live', 'منشور')}
                  <Toggle checked={!!p.is_published} onChange={v => patch(p.id, { is_published: v })} />
                </span>
                {/* Featured */}
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Star size={13} className={p.featured ? 'text-amber-400' : ''} /> {tt(lang, 'Featured', 'مميّز')}
                  <Toggle checked={!!p.featured} onChange={v => patch(p.id, { featured: v })} />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-slate-500 py-10">{tt(lang, 'No projects found.', 'لا توجد مشاريع.')}</p>
      )}
    </div>
  );
}
