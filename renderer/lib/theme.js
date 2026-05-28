// Translate Blueprint theme → CSS variables + Tailwind-class helpers.

export function themeStyle(theme = {}) {
  return {
    '--primary': theme.primary_color || '#1e40af',
    '--secondary': theme.secondary_color || '#f59e0b',
    '--font-site': theme.font_family ? `'${theme.font_family}', system-ui, sans-serif` : 'system-ui, sans-serif',
    '--radius': radiusToCss(theme.border_radius),
  };
}

function radiusToCss(token) {
  switch (token) {
    case 'none': return '0';
    case 'sm': return '0.25rem';
    case 'lg': return '0.75rem';
    case 'full': return '9999px';
    case 'md':
    default: return '0.5rem';
  }
}

export function googleFontHref(family) {
  if (!family) return null;
  const slug = family.replace(/\s+/g, '+');
  return `https://fonts.googleapis.com/css2?family=${slug}:wght@400;500;600;700&display=swap`;
}
