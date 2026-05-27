import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Plus, Trash2, FolderOpen, Globe, Share2, Zap, LogOut, Settings, ArrowUpRight, Compass } from 'lucide-react';
import { useLang } from '../i18n/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import LangToggle from '../components/LangToggle.jsx';
import NewProjectModal from '../components/NewProjectModal.jsx';

const PLAN_COLORS = { free: 'text-slate-400', pro: 'text-indigo-400', enterprise: 'text-amber-400' };
const PLAN_LABELS = { free: 'Free', pro: 'Pro', enterprise: 'Enterprise' };

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const { t, lang } = useLang();
  const { user, logout, authFetch } = useAuth();

  useEffect(() => {
    Promise.all([
      authFetch('/api/projects').then(r => r.json()),
      authFetch('/api/usage').then(r => r.json()),
    ]).then(([p, u]) => { setProjects(p); setUsage(u); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    await authFetch(`/api/projects/${id}`, { method: 'DELETE' });
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handlePublish = async (project) => {
    const res = await authFetch(`/api/projects/${project.id}/publish`, { method: 'POST' });
    const data = await res.json();
    if (data.url) {
      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, is_published: true, published_slug: data.slug } : p));
      window.open(data.url, '_blank');
    }
  };

  const handleUnpublish = async (id) => {
    await authFetch(`/api/projects/${id}/unpublish`, { method: 'POST' });
    setProjects(prev => prev.map(p => p.id === id ? { ...p, is_published: false } : p));
  };

  const tokenPct = usage ? Math.round((usage.tokens_used / usage.tokens_limit) * 100) : 0;
  const publishedCount = projects.filter(p => p.is_published).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top bar */}
      <nav className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white"><Sparkles size={18} /></div>
          <span className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">{t('appName')}</span>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <LangToggle />
          <Link to="/explore" className="text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">{t('explore')}</Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* ── Account sidebar ────────────────────────────── */}
        <aside className="space-y-4 lg:sticky lg:top-20 self-start">
          {/* Profile card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-lg font-bold text-white shrink-0">
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-white truncate">{user?.name}</div>
                <div className="text-xs text-slate-500 truncate">{user?.email}</div>
              </div>
            </div>
            <div className="flex items-center justify-between bg-slate-800/60 rounded-xl px-3 py-2">
              <span className="text-xs text-slate-400">{lang === 'ar' ? 'الخطة' : 'Plan'}</span>
              <span className={`text-xs font-bold ${PLAN_COLORS[user?.plan] || 'text-slate-400'}`}>{PLAN_LABELS[user?.plan] || 'Free'}</span>
            </div>
          </div>

          {/* Usage card */}
          {usage && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                  <Zap size={14} className="text-indigo-400" />
                  {lang === 'ar' ? 'استهلاك التوكن' : 'Token Usage'}
                </div>
                <span className={`text-xs font-bold ${tokenPct >= 90 ? 'text-red-400' : tokenPct >= 70 ? 'text-amber-400' : 'text-emerald-400'}`}>{tokenPct}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2">
                <div
                  className={`h-1.5 rounded-full transition-all ${tokenPct >= 90 ? 'bg-red-500' : tokenPct >= 70 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                  style={{ width: `${Math.min(tokenPct, 100)}%` }}
                />
              </div>
              <div className="text-xs text-slate-500">
                {usage.tokens_used.toLocaleString()} / {usage.tokens_limit.toLocaleString()}
              </div>
              {tokenPct >= 80 && (
                <button className="mt-3 w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg py-2 text-xs font-medium flex items-center justify-center gap-1.5">
                  <ArrowUpRight size={13} /> {lang === 'ar' ? 'ترقية' : 'Upgrade'}
                </button>
              )}
            </div>
          )}

          {/* Stats card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 grid grid-cols-2 gap-3">
            <div>
              <div className="text-2xl font-bold text-white">{projects.length}</div>
              <div className="text-xs text-slate-500">{lang === 'ar' ? 'مشاريع' : 'Projects'}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">{publishedCount}</div>
              <div className="text-xs text-slate-500">{lang === 'ar' ? 'منشورة' : 'Published'}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2">
            <Link to="/explore" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <Compass size={14} /> {lang === 'ar' ? 'استكشف' : 'Explore'}
            </Link>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <Settings size={14} /> {lang === 'ar' ? 'الإعدادات' : 'Settings'}
            </button>
            <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
              <LogOut size={14} /> {lang === 'ar' ? 'تسجيل خروج' : 'Sign out'}
            </button>
          </div>
        </aside>

        {/* ── Projects area ───────────────────────────────── */}
        <section>
          <div className="flex justify-between items-end mb-6 gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-white">{t('myProjects')}</h1>
              <p className="text-sm text-slate-400">{t('manageProjects')}</p>
            </div>
            <button
              onClick={() => setShowNewModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <Plus size={16} /> {t('newProject')}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-3xl text-center">
              <FolderOpen size={40} className="text-slate-600 mb-3" />
              <p className="text-slate-300 font-semibold">{t('noProjects')}</p>
              <p className="text-sm text-slate-500 mb-5">{t('noProjectsDesc')}</p>
              <button
                onClick={() => setShowNewModal(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5"
              >
                <Plus size={14} /> {t('newProject')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {projects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  lang={lang}
                  t={t}
                  onDelete={() => handleDelete(project.id)}
                  onPublish={() => handlePublish(project)}
                  onUnpublish={() => handleUnpublish(project.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <NewProjectModal isOpen={showNewModal} onClose={() => setShowNewModal(false)} />
    </div>
  );
}

function ProjectCard({ project, lang, t, onDelete, onPublish, onUnpublish }) {
  const hasThumb = !!project.thumbnail_url;
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group hover:border-indigo-500/40 transition-all hover:shadow-lg hover:shadow-indigo-500/10 flex flex-col">
      {/* Thumbnail */}
      <Link to={`/editor/${project.id}`} className="block relative aspect-video bg-slate-950 overflow-hidden border-b border-slate-800">
        {hasThumb ? (
          <img src={project.thumbnail_url} alt={project.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900/40 to-slate-900 flex items-center justify-center relative">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 20px,#6366f1 20px,#6366f1 21px),repeating-linear-gradient(90deg,transparent,transparent 20px,#6366f1 20px,#6366f1 21px)' }} />
            <Sparkles className="text-indigo-400/60 z-10" size={28} />
          </div>
        )}
        {project.is_published && (
          <span className="absolute top-2 end-2 bg-emerald-500/90 text-white text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            {lang === 'ar' ? 'منشور' : 'Live'}
          </span>
        )}
      </Link>

      {/* Body */}
      <div className="p-3 flex flex-col flex-1">
        <Link to={`/editor/${project.id}`} className="text-sm font-semibold text-white mb-1 truncate group-hover:text-indigo-400 transition-colors">
          {project.name}
        </Link>
        <p className="text-xs text-slate-500 mb-3 line-clamp-2 min-h-[2rem]">
          {project.description || (lang === 'ar' ? 'لا يوجد وصف' : 'No description yet')}
        </p>

        {/* Actions row */}
        <div className="flex items-center gap-1.5 mt-auto">
          <Link
            to={`/editor/${project.id}`}
            className="flex-1 bg-slate-800 hover:bg-indigo-600 text-white text-center py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            {t('edit')}
          </Link>
          {project.is_published ? (
            <a
              href={`http://localhost:5000/hosted/${project.published_slug}/index.html`}
              target="_blank" rel="noreferrer"
              title={lang === 'ar' ? 'عرض المنشور' : 'View live'}
              className="border border-emerald-700/40 hover:bg-emerald-600 hover:text-white text-emerald-400 rounded-lg p-1.5 transition-colors"
            >
              <Globe size={13} />
            </a>
          ) : (
            <button
              onClick={onPublish}
              title={lang === 'ar' ? 'نشر' : 'Publish'}
              className="border border-indigo-700/40 hover:bg-indigo-600 hover:text-white text-indigo-400 rounded-lg p-1.5 transition-colors"
            >
              <Globe size={13} />
            </button>
          )}
          {project.is_published && (
            <button
              onClick={onUnpublish}
              title={lang === 'ar' ? 'إلغاء النشر' : 'Unpublish'}
              className="border border-slate-700 hover:border-amber-500 hover:text-amber-400 text-slate-400 rounded-lg p-1.5 transition-colors"
            >
              <Share2 size={13} />
            </button>
          )}
          <button
            onClick={onDelete}
            title={lang === 'ar' ? 'حذف' : 'Delete'}
            className="border border-slate-700 hover:border-red-500 hover:text-red-400 text-slate-400 rounded-lg p-1.5 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
