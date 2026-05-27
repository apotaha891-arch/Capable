import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, Layers, Globe, ArrowRight, Eye } from 'lucide-react';
import { useLang } from '../i18n/LangContext.jsx';
import LangToggle from '../components/LangToggle.jsx';

const API = 'http://localhost:5000';

export default function LandingPage() {
  const { t, lang } = useLang();
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/projects/explore`)
      .then(r => r.ok ? r.json() : [])
      .then(list => setTemplates(list.slice(0, 6)))
      .catch(() => setTemplates([]));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Sparkles size={24} />
          </div>
          <span className="font-bold text-2xl tracking-wide bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            {t('appName')}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <LangToggle />
          <Link to="/explore" className="text-slate-300 hover:text-white transition-colors">{t('explore')}</Link>
          <Link to="/dashboard" className="text-slate-300 hover:text-white transition-colors">{t('dashboard')}</Link>
          <Link to="/editor" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-full transition-all shadow-lg shadow-indigo-500/20">
            {t('startBuilding')}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-8 py-20 flex flex-col items-center text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
          {t('heroTitle1')} <br />
          {t('heroTitle2')} <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            {t('heroHighlight')}
          </span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
          {t('heroDesc')}
        </p>

        <div className="flex items-center gap-4 mb-20 flex-wrap justify-center">
          <Link to="/editor" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-full text-lg font-bold transition-all shadow-[0_0_40px_rgba(79,70,229,0.4)] flex items-center gap-2">
            {t('tryFree')} <Zap size={20} />
          </Link>
          <Link to="/explore" className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-full text-lg font-bold transition-all flex items-center gap-2">
            {t('viewGallery')} <Globe size={20} />
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full text-start">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl hover:border-indigo-500/40 transition-colors">
            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
              <Sparkles size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{t('feature1Title')}</h3>
            <p className="text-slate-400">{t('feature1Desc')}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl hover:border-cyan-500/40 transition-colors">
            <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center mb-6">
              <Layers size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{t('feature2Title')}</h3>
            <p className="text-slate-400">{t('feature2Desc')}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl hover:border-emerald-500/40 transition-colors">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
              <Globe size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{t('feature3Title')}</h3>
            <p className="text-slate-400">{t('feature3Desc')}</p>
          </div>
        </div>
      </main>

      {/* Featured Templates */}
      {templates.length > 0 && (
        <section className="border-t border-slate-800 bg-slate-900/30">
          <div className="max-w-6xl mx-auto px-8 py-20">
            <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {lang === 'ar' ? 'ابدأ من قالب جاهز' : 'Start from a template'}
                </h2>
                <p className="text-slate-400">
                  {lang === 'ar' ? 'اختر تصميماً جاهزاً وعدّله بمساعدة الذكاء الاصطناعي.' : 'Pick a ready-made design and remix it with AI.'}
                </p>
              </div>
              <Link to="/explore" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                {lang === 'ar' ? 'عرض الكل' : 'View all'} <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {templates.map(tpl => (
                <a
                  key={tpl.id}
                  href={`${API}/api/projects/preview/${tpl.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col"
                >
                  <div className="relative aspect-video bg-slate-950 overflow-hidden border-b border-slate-800">
                    {tpl.thumbnail_url ? (
                      <img src={tpl.thumbnail_url} alt={tpl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-900/40 to-slate-900 flex items-center justify-center">
                        <Sparkles className="text-indigo-400/60" size={32} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                      <span className="bg-white/95 text-slate-900 px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
                        <Eye size={12} /> {lang === 'ar' ? 'معاينة' : 'Preview'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-white truncate group-hover:text-indigo-400 transition-colors">{tpl.name}</h3>
                      {tpl.price > 0 ? (
                        <span className="text-xs font-bold text-amber-400 shrink-0">${tpl.price}</span>
                      ) : (
                        <span className="text-xs font-medium text-emerald-400 shrink-0">{lang === 'ar' ? 'مجاني' : 'Free'}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                      {tpl.description || (lang === 'ar' ? 'قالب احترافي جاهز للتعديل.' : 'A polished template, ready to remix.')}
                    </p>
                    <div className="text-xs text-slate-600 mt-auto flex items-center gap-2">
                      <span className="text-slate-400">{tpl.author || 'Capable'}</span>
                      <span>·</span>
                      <span>♥ {tpl.likes}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">
        © {new Date().getFullYear()} {t('appName')}
      </footer>
    </div>
  );
}
