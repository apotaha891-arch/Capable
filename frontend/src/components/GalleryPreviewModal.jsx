import React from 'react';
import { X, Copy, Rocket, Heart, Eye, ExternalLink } from 'lucide-react';

// Lightweight preview modal for a gallery project.
// For real community projects with a live URL, it embeds the page in an iframe;
// otherwise it shows a large still of the design.
export default function GalleryPreviewModal({ project, lang, t, onClose, onClone, onDeploy }) {
  if (!project) return null;
  const isAr = lang === 'ar';
  const primary = isAr ? (project.nameAr || project.nameEn) : (project.nameEn || project.nameAr);
  const secondary = isAr ? project.nameEn : project.nameAr;
  const showSecondary = secondary && secondary !== primary;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-800">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white truncate" dir={isAr ? 'rtl' : 'ltr'}>{primary}</h3>
            {showSecondary && <p className="text-sm text-slate-400 truncate" dir={isAr ? 'ltr' : 'rtl'}>{secondary}</p>}
            <p className="text-xs text-slate-500 mt-1">{t('by')} <span className="text-indigo-400">{project.author || 'Anonymous'}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Preview surface */}
        <div className="flex-1 overflow-auto bg-slate-950">
          {project.previewUrl ? (
            <iframe src={project.previewUrl} title={primary} className="w-full h-[55vh] bg-white" />
          ) : project.image ? (
            <img src={project.image} alt={primary} className="w-full object-cover" />
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">{t('galleryPreviewSoon')}</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800">
          {project.description && <p className="text-sm text-slate-400 mb-4 leading-relaxed">{project.description}</p>}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Heart size={13} className="text-pink-500" /> {project.likes || 0} {t('likes')}</span>
              <span className="flex items-center gap-1"><Eye size={13} /> {project.views || 0} {t('views')}</span>
              {project.previewUrl && (
                <a href={project.previewUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300">
                  <ExternalLink size={13} /> {t('preview')}
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onDeploy?.(project)}
                className="border border-slate-700 hover:border-emerald-500 hover:text-emerald-400 text-slate-300 rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                <Rocket size={14} /> {t('deploy')}
              </button>
              <button
                onClick={() => onClone?.(project)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Copy size={14} /> {t('cloneEdit')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
