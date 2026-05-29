import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Globe } from 'lucide-react';
import { useLang } from '../i18n/LangContext.jsx';
import LangToggle from '../components/LangToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import NewProjectModal from '../components/NewProjectModal.jsx';
import GalleryCard from '../components/GalleryCard.jsx';
import GalleryPreviewModal from '../components/GalleryPreviewModal.jsx';
import { GALLERY_TEMPLATES, CATEGORIES, categoryLabel } from '../data/galleryTemplates.js';

const API = 'http://localhost:5000';
const COMMUNITY = 'community';

export default function Explore() {
  const [apiProjects, setApiProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [activeCat, setActiveCat] = useState('all');
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const { user, authFetch } = useAuth();

  useEffect(() => {
    fetch(`${API}/api/projects/explore`)
      .then(r => (r.ok ? r.json() : []))
      .then(data => { setApiProjects(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Normalize real community projects + curated demo templates into one shape.
  const projects = useMemo(() => {
    const community = apiProjects.map(p => ({
      id: `db-${p.id}`,
      dbId: p.id,
      nameEn: p.name_en || p.name,
      nameAr: p.name_ar || (/[؀-ۿ]/.test(p.name || '') ? p.name : ''),
      description: p.description || t('showcaseTemplateDesc'),
      author: p.author,
      image: p.thumbnail_url,
      price: p.price || 0,
      likes: p.likes || 0,
      views: p.views || 0,
      category: COMMUNITY,
      previewUrl: `${API}/api/projects/preview/${p.id}`,
      isDemo: false,
    }));

    const demos = GALLERY_TEMPLATES.map(tpl => ({
      id: tpl.id,
      nameEn: tpl.name_en,
      nameAr: tpl.name_ar,
      description: lang === 'ar' ? tpl.desc_ar : tpl.desc_en,
      author: tpl.author,
      image: tpl.image,
      price: tpl.price || 0,
      likes: tpl.likes || 0,
      views: tpl.views || 0,
      category: tpl.category,
      previewUrl: null,
      isDemo: true,
    }));

    return [...community, ...demos];
  }, [apiProjects, lang, t]);

  // Build the list of category sections in display order, only non-empty ones.
  const sections = useMemo(() => {
    const order = [{ id: COMMUNITY, label: t('galleryCommunity') }, ...CATEGORIES.map(c => ({ id: c.id, label: categoryLabel(c.id, lang) }))];
    return order
      .map(s => ({ ...s, items: projects.filter(p => p.category === s.id) }))
      .filter(s => s.items.length > 0);
  }, [projects, lang, t]);

  const visibleSections = activeCat === 'all' ? sections : sections.filter(s => s.id === activeCat);

  // ── Actions ──────────────────────────────────────────────────────────────
  const requireAuth = () => {
    if (!user) { navigate('/auth'); return false; }
    return true;
  };

  const handleClone = async (project) => {
    if (project.price > 0) { alert(t('premiumCloneAlert')); return; }
    if (!requireAuth()) return;
    if (project.isDemo) {
      // Demo templates aren't backed by the DB yet — start a fresh build.
      navigate('/dashboard');
      return;
    }
    try {
      const res = await authFetch(`/api/projects/${project.dbId}/clone`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      const np = await res.json();
      navigate(np.has_blueprint ? `/blueprint/${np.id}` : `/editor/${np.id}`);
    } catch (err) {
      console.error('Failed to clone:', err);
    }
  };

  const handleDeploy = (project) => {
    if (!requireAuth()) return;
    if (project.isDemo) alert(t('galleryDeployHint'));
    navigate('/dashboard');
  };

  // Real projects have a live page → open it directly in a new tab. Demo
  // catalog items have no hosted build, so fall back to the in-app image modal.
  const handlePreview = (project) => {
    if (project.previewUrl) window.open(project.previewUrl, '_blank', 'noopener');
    else setPreview(project);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-30">
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
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{t('exploreTitle')}</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">{t('exploreDesc')}</p>
        </div>

        {/* Field filter bar */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <FilterPill label={t('galleryAllFields')} active={activeCat === 'all'} onClick={() => setActiveCat('all')} />
          {sections.map(s => (
            <FilterPill key={s.id} label={s.label} active={activeCat === s.id} onClick={() => setActiveCat(s.id)} />
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400" />
          </div>
        ) : visibleSections.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-3xl text-center">
            <Globe size={48} className="text-slate-600 mb-4" />
            <p className="text-slate-400">{t('noPublicProjects')}</p>
          </div>
        ) : (
          <div className="space-y-14">
            {visibleSections.map(section => (
              <section key={section.id}>
                <div className="flex items-baseline justify-between mb-5">
                  <h2 className="text-xl font-bold text-white">{section.label}</h2>
                  <span className="text-xs text-slate-500">{section.items.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.items.map(project => (
                    <GalleryCard
                      key={project.id}
                      project={project}
                      lang={lang}
                      t={t}
                      onClone={handleClone}
                      onPreview={handlePreview}
                      onDeploy={handleDeploy}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <GalleryPreviewModal
        project={preview}
        lang={lang}
        t={t}
        onClose={() => setPreview(null)}
        onClone={(p) => { setPreview(null); handleClone(p); }}
        onDeploy={(p) => { setPreview(null); handleDeploy(p); }}
      />
      <NewProjectModal isOpen={showNewModal} onClose={() => setShowNewModal(false)} />
    </div>
  );
}

function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
        active
          ? 'bg-indigo-600 border-indigo-500 text-white'
          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-indigo-500/50 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}
