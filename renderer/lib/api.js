// Fetch a published project's Blueprint from the Express API (server-side only).

const API_BASE = process.env.CAPABLE_API_URL || 'http://localhost:5000';

export async function fetchBlueprintBySlug(slug, { revalidate = 60 } = {}) {
  const res = await fetch(`${API_BASE}/api/render/${encodeURIComponent(slug)}`, {
    next: { revalidate, tags: [`project:${slug}`] },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`fetchBlueprintBySlug ${slug} → ${res.status}`);
  return res.json();
}
