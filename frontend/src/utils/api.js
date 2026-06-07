// Base URL of the Capable backend API. In production set VITE_API_URL (e.g. on
// Vercel) to the deployed backend origin; locally it falls back to the dev server.
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Public URL of a hosted (non-blueprint) site's rendered index document.
export function hostedUrl(slug) {
  if (!slug) return null;
  return `${API_BASE}/hosted/${slug}/index.html`;
}
