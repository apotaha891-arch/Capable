import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, Layers, Globe } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Sparkles size={24}/>
          </div>
          <span className="font-bold text-2xl tracking-wide bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Capable</span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link to="/explore" className="text-slate-300 hover:text-white transition-colors">Explore Projects</Link>
          <Link to="/dashboard" className="text-slate-300 hover:text-white transition-colors">Dashboard</Link>
          <Link to="/editor" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-full transition-all shadow-lg shadow-indigo-500/20">Start Building</Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-20 flex flex-col items-center text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
          Build UI at the <br/> speed of <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">thought</span>.
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
          Capable uses advanced AI to instantly turn your text descriptions into fully functional, beautiful web applications. Stop coding from scratch, start creating.
        </p>
        
        <div className="flex items-center gap-4 mb-20">
          <Link to="/editor" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-full text-lg font-bold transition-all shadow-[0_0_40px_rgba(79,70,229,0.4)] flex items-center gap-2">
            Try it for free <Zap size={20}/>
          </Link>
          <Link to="/explore" className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-full text-lg font-bold transition-all flex items-center gap-2">
            View Gallery <Globe size={20}/>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full text-left">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
              <Sparkles size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">AI-Powered Generation</h3>
            <p className="text-slate-400">Describe what you want, and Capable writes the HTML, CSS, and JS instantly. Iterate seamlessly.</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
            <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center mb-6">
              <Layers size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Modern Stack</h3>
            <p className="text-slate-400">Generates clean, responsive code using Tailwind CSS and standard web technologies.</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
              <Globe size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Share & Discover</h3>
            <p className="text-slate-400">Publish your creations to the community gallery, or fork and remix projects built by others.</p>
          </div>
        </div>
      </main>
    </div>
  );
}