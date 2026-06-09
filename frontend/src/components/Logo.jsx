import React from 'react';
import { Link } from 'react-router-dom';
import CapableLogo from './CapableLogo.jsx';
import { useLang } from '../i18n/LangContext.jsx';

// Single source of truth for the Capable brand lockup: the "C" mark in a
// branded tile plus the wordmark. Use everywhere a logo appears so the brand
// stays consistent across the platform.
//
//   appearance="auto" (default) — navy in light mode, indigo→cyan gradient in
//     dark. For theme-aware pages (marketing site, editor).
//   appearance="dark" — always the gradient/white treatment. For pages that are
//     always dark (dashboard, builder, explore, auth, marketplace…).
//
// size: 'sm' | 'md' | 'lg'. withWord toggles the wordmark. `to` wraps it in a
// Link (pass null to render inline, e.g. inside an existing anchor).
export default function Logo({ to = '/', withWord = true, size = 'md', appearance = 'auto', className = '', wordClassName = '' }) {
  const { t } = useLang();
  const dark = appearance === 'dark';

  const tilePad = size === 'sm' ? 'p-1.5' : size === 'lg' ? 'p-2.5' : 'p-2';
  const markSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 20;
  const wordSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  const tileCls = dark
    ? 'bg-gradient-to-br from-indigo-500 to-cyan-400'
    : 'bg-capable-navy dark:bg-gradient-to-br dark:from-indigo-500 dark:to-cyan-400';
  const wordCls = dark
    ? 'bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent'
    : 'text-capable-navy dark:bg-gradient-to-r dark:from-indigo-300 dark:to-cyan-300 dark:bg-clip-text dark:text-transparent';

  const content = (
    <>
      <span className={`shrink-0 inline-flex rounded-brand text-white ${tilePad} ${tileCls}`}>
        <CapableLogo size={markSize} strokeWidth={6.5} />
      </span>
      {withWord && (
        <span className={`font-bold tracking-tight ${wordSize} ${wordCls} ${wordClassName}`}>{t('appName')}</span>
      )}
    </>
  );

  const base = `inline-flex items-center gap-2 ${className}`;
  return to ? <Link to={to} className={base}>{content}</Link> : <span className={base}>{content}</span>;
}
