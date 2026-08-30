// Public URL of a rendered site. When VITE_APP_DOMAIN is set (production), uses
// the {slug}.domain subdomain form; otherwise falls back to the local renderer
// path form for testing without a domain.
const APP_DOMAIN = import.meta.env.VITE_APP_DOMAIN;
const LOCAL_RENDERER = import.meta.env.VITE_RENDERER_URL || 'http://localhost:3007';

export function siteUrl(slug) {
  if (!slug) return null;
  return APP_DOMAIN ? `https://${slug}.${APP_DOMAIN}` : `${LOCAL_RENDERER}/${slug}`;
}

// These take the already-resolved public URL (hosted for code projects, renderer
// for blueprints) — the caller picks the right one. Passing a slug here would
// wrongly force the renderer form for code projects, which live at /hosted/….
export function whatsappShareUrl(name, url) {
  return `https://wa.me/?text=${encodeURIComponent(`${name} ${url}`)}`;
}

// Native share if available (mobile), else copy link. Returns the action taken.
export async function shareSite(name, url) {
  if (!url) return 'error';
  if (navigator.share) {
    try { await navigator.share({ title: name, url }); return 'shared'; }
    catch { return 'cancelled'; }
  }
  try { await navigator.clipboard.writeText(url); return 'copied'; }
  catch { return 'error'; }
}
