import React from 'react';
import { useLang } from '../i18n/LangContext.jsx';

export default function LangToggle({ className = '' }) {
  const { lang, toggleLang } = useLang();
  return (
    <button
      onClick={toggleLang}
      title={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium text-slate-300 hover:text-white transition-all ${className}`}
    >
      <span className="text-base leading-none">{lang === 'ar' ? '🇺🇸' : '🇸🇦'}</span>
      <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
    </button>
  );
}
