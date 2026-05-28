import React from 'react';
import { useLang } from '../i18n/LangContext.jsx';

export default function LangToggle({ className = '' }) {
  const { lang, toggleLang } = useLang();
  return (
    <button
      onClick={toggleLang}
      title={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      className={
        'flex items-center gap-1.5 px-3 h-9 rounded-brand border text-sm font-semibold transition-colors ' +
        'bg-white border-gray-200 text-capable-navy hover:bg-capable-surface ' +
        'dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 ' +
        className
      }
    >
      <span className="text-base leading-none">{lang === 'ar' ? '🇺🇸' : '🇸🇦'}</span>
      <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
    </button>
  );
}
