import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Copy, Heart, Eye, Globe } from 'lucide-react';
import { useLang } from '../i18n/LangContext.jsx';
import LangToggle from '../components/LangToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import NewProjectModal from '../components/NewProjectModal.jsx';

export default function Explore() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const navigate = useNavigate();
  const { t } = useLang();
  const { user, authFetch } = useAuth();

  useEffect(() => {
    fetch('http://localhost:5000/api/projects/explore')
      .then(r => r.json())
      .then(data => { setProjects(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleClone = async (project) => {
    if (project.price > 0) {
      alert(t('premiumCloneAlert'));
      return;
    }
    if (!user) {
      navigate('/auth');
      return;
    }
    try {
      const response = await authFetch(`/api/projects/${project.id}/clone`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed');
      const newProject = await response.json();
      navigate(newProject.has_blueprint ? `/blueprint/${newProject.id}` : `/editor/${newProject.id}`);
    } catch (err) {
      console.error('Failed to clone:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-slate-900">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white"><Sparkles size={20} /></div>
          <span className="font-bold text-xl tracking-wide bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            {t('appName')}
          </span>
        </Link>
        <div className="flex items-center gap-3 text-sm font-medium">
          <LangToggle />
          <Link to="/dashboard" className="text-slate-300 hover:text-white transition-colors">{t('dashboard')}</Link>
          <button 
            onClick={() => setShowNewModal(true)} 
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-all"
          >
            {t('newProject')}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{t('exploreTitle')}</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">{t('exploreDesc')}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-3xl text-center">
            <Globe size={48} className="text-slate-600 mb-4" />
            <p className="text-slate-400">{t('noPublicProjects')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map(project => (
              <div key={project.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group hover:border-indigo-500/40 transition-all">
                {/* Preview */}
                <div className="h-48 bg-slate-800 relative overflow-hidden flex items-center justify-center">
                  {project.thumbnail_url ? (
                    <img src={project.thumbnail_url} alt={project.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <>
                      <div className="absolute inset-0 opacity-5"
                        style={{backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 24px,#6366f1 24px,#6366f1 25px),repeating-linear-gradient(90deg,transparent,transparent 24px,#6366f1 24px,#6366f1 25px)'}} />
                      <Sparkles className="text-slate-500 opacity-40 z-0" size={56} />
                    </>
                  )}
                  
                  {/* Price Badge */}
                  <div className="absolute top-3 end-3 z-20">
                    {project.price > 0 ? (
                      <span className="bg-amber-500 text-slate-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-lg border border-amber-400">
                        ${project.price} {t('premium')}
                      </span>
                    ) : (
                      <span className="bg-emerald-500/90 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg border border-emerald-400/50">
                        {t('free')}
                      </span>
                    )}
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/90 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <button
                      onClick={() => handleClone(project)}
                      className="bg-white text-slate-900 w-full text-center py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors"
                    >
                      <Copy size={15} /> Clone & Edit
                    </button>
                  </div>
                </div>

                <div className="p-5 flex flex-col justify-between" style={{ minHeight: '140px' }}>
                  <div>
                    <h3 className="text-base font-bold text-white mb-0.5 truncate">{project.name}</h3>
                    {(() => {
                      const isArabic = /[؀-ۿ]/.test(project.name || '');
                      const alt = isArabic ? project.name_en : project.name_ar;
                      return alt && alt !== project.name ? (
                        <p className="text-xs text-slate-400 mb-1 truncate" dir={isArabic ? 'ltr' : 'rtl'}>{alt}</p>
                      ) : null;
                    })()}
                    <p className="text-xs text-slate-500 mb-3 truncate">
                      by <span className="text-indigo-400">{project.author || 'Anonymous'}</span>
                    </p>
                    {project.description && (
                      <p className="text-sm text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1"><Heart size={13} className="text-pink-500" /> {project.likes || 0} {t('likes')}</span>
                      <span className="flex items-center gap-1"><Eye size={13} /> {project.views || 0} {t('views')}</span>
                    </div>
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