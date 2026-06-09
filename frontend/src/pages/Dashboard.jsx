import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Plus, Trash2, FolderOpen, Globe, GlobeLock, Share2, Zap, LogOut, Settings, ArrowUpRight, Compass, Wand2, MessageCircle, Link2, Check, Users, ChevronRight, Shield, Gauge, Tag, Target, HelpCircle } from 'lucide-react';
import { useLang } from '../i18n/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import LangToggle from '../components/LangToggle.jsx';
import NotificationBell from '../components/NotificationBell.jsx';
import { siteUrl, whatsappShareUrl, shareSite } from '../utils/site.js';
import { hostedUrl } from '../utils/api.js';
import Logo from '../components/Logo.jsx';

const PLAN_COLORS = { free: 'text-slate-400', pro: 'text-indigo-400', enterprise: 'text-amber-400' };
const PLAN_LABELS = { free: 'Free', pro: 'Pro', enterprise: 'Enterprise' };

function AIPowerBar({ used, limit, lang, t }) {
  const pct = Math.round((used / limit) * 100);
  const segments = 10;
  const filledSegments = Math.round((pct / 100) * segments);

  let statusLabel, statusColor, barColor;
  if (pct < 50) {
    statusLabel = t('creditsFull');
    statusColor = 'text-emerald-400';
    barColor = 'bg-emerald-500';
  } else if (pct < 75) {
    statusLabel = t('creditsGood');
    statusColor = 'text-indigo-400';
    barColor = 'bg-indigo-500';
  } else if (pct < 90) {
    statusLabel = t('creditsLow');
    statusColor = 'text-amber-400';
    barColor = 'bg-amber-500';
  } else {
    statusLabel = t('creditsCritical');
    statusColor = 'text-red-400';
    barColor = 'bg-red-500';
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-sm font-medium text-white">
          <Zap size={14} className="text-indigo-400" />
          {t('aiCredits')}
        </div>
        <span className={`text-xs font-bold ${statusColor}`}>{statusLabel}</span>
      </div>

      {/* Segmented power bar */}
      <div className="flex gap-1 mb-3">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded-sm transition-all ${i < filledSegments ? barColor : 'bg-slate-800'}`}
          />
        ))}
      </div>

      <p className="text-xs text-slate-500 mb-1">{t('aiCreditsDesc')}</p>

      {pct >= 75 && (
        <button className="mt-3 w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors">
          <ArrowUpRight size={13} /> {t('upgradeForMore')}
        </button>
      )}
    </div>
  );
}

function ConsultingCard({ lang, t }) {
  return (
    <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/30 border border-indigo-700/40 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-indigo-500/20 rounded-xl flex items-center justify-center">
          <Users size={15} className="text-indigo-300" />
        </div>
        <span className="text-sm font-bold text-white">{t('consultTitle')}</span>
      </div>
      <p className="text-xs text-slate-400 mb-3 leading-relaxed">{t('consultDesc')}</p>
      <a
        href="mailto:hello@capable.app?subject=Expert%20Help%20Request"
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
      >
        {t('consultCta')} <ChevronRight size={12} />
      </a>
    </div>
  );
}

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [usage, setUsage] = useState(null);
  const [quota, setQuota] = useState(null);
  const { t, lang } = useLang();
  const { user, logout, authFetch } = useAuth();

  const loadData = () => {
    setLoading(true);
    setLoadError(false);
    Promise.all([
      authFetch('/api/projects').then(r => r.json()),
      authFetch('/api/usage').then(r => r.json()),
      authFetch('/api/blueprint/quota').then(r => r.json()).catch(() => null),
    ]).then(([p, u, q]) => {
      setProjects(Array.isArray(p) ? p : []);
      setUsage(u);
      setQuota(q);
      setLoading(false);
    }).catch(() => { setLoadError(true); setLoading(false); });
  };

  useEffect(() => { loadData(); }, []);

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

  const publishedCount = projects.filter(p => p.is_published).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top bar */}
      <nav className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <Logo to="/" size="sm" appearance="dark" />
        <div className="flex items-center gap-3 text-sm">
          <NotificationBell />
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

          {/* AI Power Bar */}
          {usage && (
            <AIPowerBar
              used={usage.tokens_used}
              limit={usage.tokens_limit}
              lang={lang}
              t={t}
            />
          )}

          {/* Quota card (tier limits) */}
          {quota && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <QuotaBar
                label={lang === 'ar' ? 'توليدات اليوم' : 'Generations today'}
                used={quota.generations_today}
                limit={quota.generations_limit}
                lang={lang}
              />
              <QuotaBar
                label={lang === 'ar' ? 'المشاريع' : 'Projects'}
                used={quota.projects_count}
                limit={quota.projects_limit}
                lang={lang}
              />
              {quota.plan === 'free' && (
                <button className="w-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg py-2 text-xs font-medium flex items-center justify-center gap-1.5">
                  <ArrowUpRight size={13} /> {lang === 'ar' ? 'الترقية إلى Pro' : 'Upgrade to Pro'}
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
              <div className="text-xs text-slate-500">{lang === 'ar' ? 'منشورة' : 'Live'}</div>
            </div>
          </div>

          {/* Consulting CTA */}
          <ConsultingCard lang={lang} t={t} />

          {/* Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2">
            {user?.role === 'admin' && (
              <Link to="/admin" className="flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors font-medium">
                <Shield size={14} /> {t('adminPanel')}
              </Link>
            )}
            <Link to="/explore" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <Compass size={14} /> {lang === 'ar' ? 'استكشف القوالب' : 'Browse Templates'}
            </Link>
            <Link to="/influence" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <Sparkles size={14} /> {lang === 'ar' ? 'تأثير' : 'Influence Pass'}
            </Link>
            <Link to="/challenges" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <Target size={14} /> {lang === 'ar' ? 'التحديات' : 'Challenges'}
            </Link>
            <Link to="/marketplace" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <Tag size={14} /> {lang === 'ar' ? 'السوق' : 'Marketplace'}
            </Link>
            <Link to="/docs" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <HelpCircle size={14} /> {lang === 'ar' ? 'التوثيق' : 'Docs'}
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
            <Link
              to="/builder"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <Plus size={16} /> {t('newProject')}
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" role="status" aria-label={lang === 'ar' ? 'جارٍ التحميل' : 'Loading'} />
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-red-900/40 rounded-3xl text-center">
              <p className="text-slate-200 font-semibold">{lang === 'ar' ? 'تعذّر تحميل مشاريعك' : 'Couldn’t load your projects'}</p>
              <p className="text-sm text-slate-500 mb-5">{lang === 'ar' ? 'تحقّق من اتصالك ثم حاول مجدداً.' : 'Check your connection and try again.'}</p>
              <button
                onClick={loadData}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-medium"
              >
                {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
              </button>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-3xl text-center">
              <FolderOpen size={40} className="text-slate-600 mb-3" />
              <p className="text-slate-300 font-semibold">{t('noProjects')}</p>
              <p className="text-sm text-slate-500 mb-5">{t('noProjectsDesc')}</p>
              <div className="flex gap-3">
                <Link
                  to="/builder"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5"
                >
                  <Plus size={14} /> {t('newProject')}
                </Link>
                <Link
                  to="/explore"
                  className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5"
                >
                  <Compass size={14} /> {lang === 'ar' ? 'استكشف القوالب' : 'Browse Templates'}
                </Link>
              </div>
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
    </div>
  );
}

function QuotaBar({ label, used, limit, lang }) {
  const unlimited = limit == null;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const color = pct >= 100 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-indigo-500';
  return (
    <div>
      <div className="flex items-center justify-between mb-2 text-sm">
        <span className="flex items-center gap-1.5 font-medium text-white"><Wand2 size={14} className="text-indigo-400" />{label}</span>
        <span className="text-xs text-slate-400" dir="ltr">{used}{unlimited ? '' : ` / ${limit}`}{unlimited ? ` (${lang === 'ar' ? 'غير محدود' : 'unlimited'})` : ''}</span>
      </div>
      {!unlimited && (
        <div className="w-full bg-slate-800 rounded-full h-1.5">
          <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

// A thumbnail URL is unusable if it was captured with a localhost BASE_URL (old
// rows) — treat those as missing so the placeholder shows instead of a broken
// image. onError below also catches files that 404 (e.g. lost on a volume reset).
const isBrokenThumb = (url) => !url || /\/\/localhost|:5000\//.test(url);

function ProjectCard({ project, lang, t, onDelete, onPublish, onUnpublish }) {
  const [imgError, setImgError] = useState(false);
  const hasThumb = !isBrokenThumb(project.thumbnail_url) && !imgError;
  const editPath = project.has_blueprint ? `/blueprint/${project.id}` : `/editor/${project.id}`;
  const liveUrl = project.has_blueprint
    ? siteUrl(project.published_slug)
    : hostedUrl(project.published_slug);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const onShare = async () => {
    const action = await shareSite(project.name, project.published_slug);
    if (action === 'copied') { setCopied(true); setTimeout(() => setCopied(false), 1500); }
    else if (action === 'shared') { /* native sheet handled it */ }
    else setShareOpen(o => !o); // no native share + copy failed → show fallback menu
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group hover:border-indigo-500/40 transition-all hover:shadow-lg hover:shadow-indigo-500/10 flex flex-col">
      {/* Thumbnail */}
      <Link to={editPath} className="block relative aspect-video bg-slate-950 overflow-hidden border-b border-slate-800">
        {hasThumb ? (
          <img src={project.thumbnail_url} alt={project.name} onError={() => setImgError(true)} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform" />
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
        <Link to={editPath} className="text-sm font-semibold text-white mb-1 truncate group-hover:text-indigo-400 transition-colors">
          {project.name}
        </Link>
        <p className="text-xs text-slate-500 mb-3 line-clamp-2 min-h-[2rem]">
          {project.description || (lang === 'ar' ? 'لا يوجد وصف' : 'No description yet')}
        </p>

        {/* Actions row */}
        <div className="flex items-center gap-1.5 mt-auto">
          <Link
            to={editPath}
            className="flex-1 bg-slate-800 hover:bg-indigo-600 text-white text-center py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            {t('edit')}
          </Link>
          <Link
            to={`/project/${project.id}`}
            title={lang === 'ar' ? 'لوحة تحكم المشروع' : 'Project control panel'}
            aria-label={lang === 'ar' ? 'لوحة تحكم المشروع' : 'Project control panel'}
            className="border border-slate-700 hover:border-indigo-500 hover:text-indigo-400 text-slate-400 rounded-lg p-1.5 transition-colors"
          >
            <Gauge size={13} />
          </Link>
          {project.is_published ? (
            <a
              href={liveUrl}
              target="_blank" rel="noreferrer"
              title={lang === 'ar' ? 'عرض المنشور' : 'View live'}
              aria-label={lang === 'ar' ? 'عرض الموقع المنشور' : 'View live site'}
              className="border border-emerald-700/40 hover:bg-emerald-600 hover:text-white text-emerald-400 rounded-lg p-1.5 transition-colors"
            >
              <Globe size={13} />
            </a>
          ) : (
            <button
              onClick={onPublish}
              title={lang === 'ar' ? 'نشر' : 'Publish'}
              aria-label={lang === 'ar' ? 'نشر المشروع' : 'Publish project'}
              className="border border-indigo-700/40 hover:bg-indigo-600 hover:text-white text-indigo-400 rounded-lg p-1.5 transition-colors"
            >
              <Globe size={13} />
            </button>
          )}
          {project.is_published && (
            <div className="relative">
              <button
                onClick={onShare}
                title={lang === 'ar' ? 'مشاركة' : 'Share'}
                aria-label={copied ? (lang === 'ar' ? 'تم نسخ الرابط' : 'Link copied') : (lang === 'ar' ? 'مشاركة' : 'Share')}
                className="border border-slate-700 hover:border-indigo-500 hover:text-indigo-400 text-slate-400 rounded-lg p-1.5 transition-colors"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} />}
              </button>
              {shareOpen && (
                <div className="absolute end-0 bottom-full mb-1 z-20 w-40 bg-slate-800 border border-slate-700 rounded-lg p-1 shadow-xl">
                  <a
                    href={whatsappShareUrl(project.name, project.published_slug)}
                    target="_blank" rel="noreferrer"
                    onClick={() => setShareOpen(false)}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-700 rounded"
                  >
                    <MessageCircle size={13} className="text-green-400" /> WhatsApp
                  </a>
                  <button
                    onClick={async () => { await navigator.clipboard.writeText(siteUrl(project.published_slug)); setCopied(true); setShareOpen(false); setTimeout(() => setCopied(false), 1500); }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-700 rounded"
                  >
                    <Link2 size={13} /> {lang === 'ar' ? 'نسخ الرابط' : 'Copy link'}
                  </button>
                </div>
              )}
            </div>
          )}
          {project.is_published && (
            <button
              onClick={onUnpublish}
              title={lang === 'ar' ? 'إلغاء النشر' : 'Unpublish'}
              aria-label={lang === 'ar' ? 'إلغاء نشر المشروع' : 'Unpublish project'}
              className="border border-slate-700 hover:border-amber-500 hover:text-amber-400 text-slate-400 rounded-lg p-1.5 transition-colors"
            >
              <GlobeLock size={13} />
            </button>
          )}
          <button
            onClick={onDelete}
            title={lang === 'ar' ? 'حذف' : 'Delete'}
            aria-label={lang === 'ar' ? 'حذف المشروع' : 'Delete project'}
            className="border border-slate-700 hover:border-red-500 hover:text-red-400 text-slate-400 rounded-lg p-1.5 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
