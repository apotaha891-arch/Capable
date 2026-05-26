import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Plus, Clock, Trash2, FolderOpen, Globe, Share2, Zap, LogOut } from 'lucide-react';
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
      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, is_published: 1, published_slug: data.slug } : p));
      window.open(data.url, '_blank');
    }
  };

  const handleUnpublish = async (id) => {
    await authFetch(`/api/projects/${id}/unpublish`, { method: 'POST' });
    setProjects(prev => prev.map(p => p.id === id ? { ...p, is_published: 0 } : p));
  };

  const tokenPct = usage ? Math.round((usage.tokens_used / usage.tokens_limit) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-slate-900">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white"><Sparkles size={20} /></div>
          <span className="font-bold text-xl tracking-wide bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">{t('appName')}</span>
        </Link>
        <div className="flex items-center gap-3">
          <LangToggle />
          <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="text-sm">
              <div className="text-white font-medium">{user?.name}</div>
              <div className={`text-xs ${PLAN_COLORS[user?.plan] || 'text-slate-400'}`}>{PLAN_LABELS[user?.plan] || 'Free'}</div>
            </div>
          </div>
          <button onClick={logout} className="text-slate-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-slate-800" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-10">
        {/* Token usage bar */}
        {usage && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-indigo-400" />
                <span className="text-sm font-medium text-white">
                  {lang === 'ar' ? 'استهلاك التوكن' : 'Token Usage'}
                </span>
              </div>
              <span className="text-sm text-slate-400">
                {usage.tokens_used.toLocaleString()} / {usage.tokens_limit.toLocaleString()}
                <span className={`ms-2 font-bold ${tokenPct >= 90 ? 'text-red-400' : tokenPct >= 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  ({tokenPct}%)
                </span>
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${tokenPct >= 90 ? 'bg-red-500' : tokenPct >= 70 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                style={{ width: `${Math.min(tokenPct, 100)}%` }}
              />
            </div>
            {tokenPct >= 80 && (
              <p className="text-xs text-amber-400 mt-2">
                {lang === 'ar' ? '⚠️ اقتربت من الحد الشهري. قم بالترقية للحصول على توكن أكثر.' : '⚠️ Approaching monthly limit. Upgrade for more tokens.'}
              </p>
            )}
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">{t('myProjects')}</h1>
            <p className="text-slate-400">{t('manageProjects')}</p>
          </div>
          <button 
            onClick={() => setShowNewModal(true)} 
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <Plus size={18} /> {t('newProject')}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-3xl text-center">
            <FolderOpen size={48} className="text-slate-600 mb-4" />
            <p className="text-slate-300 font-semibold text-lg">{t('noProjects')}</p>
            <p className="text-slate-500 mb-6">{t('noProjectsDesc')}</p>
            <button 
              onClick={() => setShowNewModal(true)} 
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2"
            >
              <Plus size={16} /> {t('newProject')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map(project => (
              <div key={project.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group hover:border-indigo-500/40 transition-all hover:shadow-lg hover:shadow-indigo-500/10">
                {/* Thumbnail */}
                <div className="h-32 bg-gradient-to-br from-indigo-900/40 to-slate-900 flex items-center justify-center border-b border-slate-800 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-5" style={{backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 20px,#6366f1 20px,#6366f1 21px),repeating-linear-gradient(90deg,transparent,transparent 20px,#6366f1 20px,#6366f1 21px)'}} />
                  <Sparkles className="text-indigo-400 opacity-50 z-10" size={32} />
                  {project.is_published ? (
                    <span className="absolute top-2 end-2 bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-500/30">
                      {lang === 'ar' ? '● منشور' : '● Live'}
                    </span>
                  ) : null}
                </div>

                <div className="p-4">
                  <h3 className="text-sm font-bold text-white mb-1 truncate group-hover:text-indigo-400 transition-colors">{project.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-4">
                    <Clock size={11} /> {project.last_edited ? new Date(project.last_edited).toLocaleString() : '—'}
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    <Link to={`/editor/${project.id}`}
                      className="col-span-2 bg-slate-800 hover:bg-indigo-600 text-white text-center py-2 rounded-lg text-xs font-medium transition-colors">
                      {t('edit')}
                    </Link>
                    <button onClick={() => handleDelete(project.id)}
                      className="border border-slate-700 hover:border-red-500 hover:text-red-400 text-slate-400 rounded-lg text-xs transition-colors flex items-center justify-center">
                      <Trash2 size={14} />
                    </button>

                    {project.is_published ? (
                      <>
                        <a href={`http://localhost:5000/hosted/${project.published_slug}/index.html`} target="_blank" rel="noreferrer"
                          className="col-span-2 bg-emerald-900/30 border border-emerald-700/50 hover:bg-emerald-600 text-emerald-400 hover:text-white text-center py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1">
                          <Globe size={12} /> {lang === 'ar' ? 'عرض المنشور' : 'View Live'}
                        </a>
                        <button onClick={() => handleUnpublish(project.id)}
                          className="border border-slate-700 hover:border-amber-500 hover:text-amber-400 text-slate-400 rounded-lg text-xs transition-colors flex items-center justify-center">
                          <Share2 size={13} />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => handlePublish(project)}
                        className="col-span-3 bg-indigo-900/30 border border-indigo-700/50 hover:bg-indigo-600 text-indigo-400 hover:text-white text-center py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1">
                        <Globe size={12} /> {lang === 'ar' ? 'نشر المشروع' : 'Publish Project'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <NewProjectModal isOpen={showNewModal} onClose={() => setShowNewModal(false)} />
    </div>
  );
}