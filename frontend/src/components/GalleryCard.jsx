import React, { useState } from 'react';
import { Sparkles, Copy, Eye, Rocket, Heart } from 'lucide-react';

// One project card used in the gallery / showcase.
// `project` is a normalized shape:
//   { id, nameEn, nameAr, description, author, image, price, likes, views }
// Action handlers (onClone / onPreview / onDeploy) receive the raw project.
export default function GalleryCard({ project, lang, t, onClone, onPreview, onDeploy }) {
  const [imgError, setImgError] = useState(false);
  const isAr = lang === 'ar';

  const primary = isAr ? (project.nameAr || project.nameEn) : (project.nameEn || project.nameAr);
  const secondary = isAr ? project.nameEn : project.nameAr;
  const showSecondary = secondary && secondary !== primary;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col group hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all">
      {/* Photo */}
      <button
        type="button"
        onClick={() => onPreview?.(project)}
        className="block relative aspect-video bg-slate-950 overflow-hidden border-b border-slate-800 text-start"
      >
        {project.image && !imgError ? (
          <img
            src={project.image}
            alt={primary}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : project.previewUrl ? (
          // No custom thumbnail → live scaled preview of the project's front page.
          <div className="absolute inset-0 overflow-hidden bg-white">
            <iframe
              src={project.previewUrl}
              title={primary}
              tabIndex={-1}
              scrolling="no"
              loading="lazy"
              sandbox="allow-scripts allow-same-origin"
              className="pointer-events-none border-0 origin-top-left"
              style={{ width: '400%', height: '400%', transform: 'scale(0.25)' }}
            />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900/40 to-slate-900 flex items-center justify-center relative">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 22px,#6366f1 22px,#6366f1 23px),repeating-linear-gradient(90deg,transparent,transparent 22px,#6366f1 22px,#6366f1 23px)' }} />
            <Sparkles className="text-indigo-400/60 z-10" size={32} />
          </div>
        )}

        {/* Price / free badge */}
        <span className="absolute top-3 end-3 z-10">
          {project.price > 0 ? (
            <span className="bg-amber-500 text-slate-900 text-xs font-bold px-2.5 py-1 rounded-full shadow border border-amber-400">
              ${project.price}
            </span>
          ) : (
            <span className="bg-emerald-500/90 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow border border-emerald-400/50">
              {t('free')}
            </span>
          )}
        </span>
      </button>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-base font-bold text-white truncate" dir={isAr ? 'rtl' : 'ltr'}>{primary}</h3>
        {showSecondary && (
          <p className="text-xs text-slate-400 truncate mt-0.5" dir={isAr ? 'ltr' : 'rtl'}>{secondary}</p>
        )}

        <p className="text-xs text-slate-500 mt-1 mb-2 truncate">
          {t('by')} <span className="text-indigo-400">{project.author || 'Anonymous'}</span>
        </p>

        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed mb-3 min-h-[2.5rem]">
          {project.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-slate-800 pt-3 mb-3">
          <span className="flex items-center gap-1"><Heart size={13} className="text-pink-500" /> {project.likes || 0}</span>
          <span className="flex items-center gap-1"><Eye size={13} /> {project.views || 0}</span>
        </div>

        {/* Actions — always visible */}
        <div className="mt-auto flex items-center gap-1.5">
          <button
            onClick={() => onClone?.(project)}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Copy size={13} /> {t('clone')}
          </button>
          <button
            onClick={() => onPreview?.(project)}
            title={t('preview')}
            className="border border-slate-700 hover:border-indigo-500 hover:text-indigo-400 text-slate-300 rounded-xl px-3 py-2 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Eye size={13} /> {t('preview')}
          </button>
          <button
            onClick={() => onDeploy?.(project)}
            title={t('deploy')}
            className="border border-slate-700 hover:border-emerald-500 hover:text-emerald-400 text-slate-300 rounded-xl px-3 py-2 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Rocket size={13} /> {t('deploy')}
          </button>
        </div>
      </div>
    </div>
  );
}
