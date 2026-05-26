import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, Layers, Globe } from 'lucide-react';
import { useLang } from '../i18n/LangContext.jsx';
import LangToggle from '../components/LangToggle.jsx';

export default function LandingPage() {
  const { t } = useLang();

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
    </div>
  );
}