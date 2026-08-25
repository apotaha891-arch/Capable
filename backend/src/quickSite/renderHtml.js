// Renders a Blueprint (schema.js) into a single self-contained static HTML
// page, mirroring the visual conventions of the Next.js renderer app
// (renderer/components/blocks/*.jsx + renderer/lib/theme.js) as closely as
// reasonable without sharing a JSX toolchain with the backend.
//
// Why this exists: the "official" published URL for a blueprint site is
// https://<slug>.<APP_DOMAIN> — but that depends on wildcard DNS + a hosted
// renderer deployment, neither of which may be set up yet. This gives every
// quick-site project a second, immediately-working URL
// (GET /api/projects/preview/:id, already used for code-projects) by snapshotting
// the blueprint into projects.code, exactly like the existing blueprint→code
// "convert to code" bridge does client-side via renderToStaticMarkup.

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Only allow href/src schemes that can't execute script (blocks javascript:, data:, etc.)
function safeUrl(url) {
  const u = String(url || '').trim();
  if (!u) return '#';
  if (/^(https?:|mailto:|tel:|#|\/)/i.test(u)) return escapeHtml(u);
  return '#';
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

function googleFontHref(family) {
  if (!family) return null;
  const slug = String(family).replace(/\s+/g, '+');
  return `https://fonts.googleapis.com/css2?family=${slug}:wght@400;500;600;700&display=swap`;
}

const BLOCK_RENDERERS = {
  HeroSection(c) {
    return `<section class="relative py-24 md:py-32 text-white" style="background:linear-gradient(135deg, var(--primary), var(--secondary))">
      <div class="max-w-5xl mx-auto px-6 text-center">
        <h1 class="text-4xl md:text-6xl font-bold leading-tight">${escapeHtml(c.title)}</h1>
        ${c.subtitle ? `<p class="mt-6 text-lg md:text-2xl opacity-90">${escapeHtml(c.subtitle)}</p>` : ''}
        ${c.cta_text ? `<a href="${safeUrl(c.cta_url)}" class="inline-block mt-10 px-8 py-4 bg-white text-slate-900 font-semibold shadow-lg hover:shadow-xl transition" style="border-radius:var(--radius)">${escapeHtml(c.cta_text)}</a>` : ''}
      </div>
    </section>`;
  },

  FeaturesGrid(c) {
    const items = (c.items || []).map(it => `
      <div class="p-6 bg-white shadow-sm border border-slate-100" style="border-radius:var(--radius)">
        <span class="inline-block w-3 h-3 rounded-full" style="background:var(--primary)"></span>
        <h3 class="mt-4 text-xl font-semibold text-slate-900">${escapeHtml(it.title)}</h3>
        <p class="mt-2 text-slate-600 leading-relaxed">${escapeHtml(it.description)}</p>
      </div>`).join('');
    return `<section class="py-20 bg-slate-50">
      <div class="max-w-6xl mx-auto px-6">
        ${c.title ? `<h2 class="text-3xl md:text-4xl font-bold text-center text-slate-900">${escapeHtml(c.title)}</h2>` : ''}
        <div class="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${items}</div>
      </div>
    </section>`;
  },

  PricingTable(c) {
    const plans = (c.plans || []).map(p => `
      <div class="p-8 bg-white border-2 border-slate-100 flex flex-col" style="border-radius:var(--radius)">
        <h3 class="text-2xl font-bold text-slate-900">${escapeHtml(p.name)}</h3>
        <div class="mt-4 text-4xl font-bold" style="color:var(--primary)">${escapeHtml(p.price)}</div>
        <ul class="mt-6 space-y-3 flex-1">
          ${(p.features || []).map(f => `<li class="flex items-start gap-2 text-slate-700"><span class="mt-1" style="color:var(--primary)">✓</span><span>${escapeHtml(f)}</span></li>`).join('')}
        </ul>
        <button class="mt-8 w-full py-3 font-semibold text-white" style="background:var(--primary);border-radius:var(--radius)">${escapeHtml(p.cta_text)}</button>
      </div>`).join('');
    return `<section class="py-20">
      <div class="max-w-6xl mx-auto px-6">
        ${c.title ? `<h2 class="text-3xl md:text-4xl font-bold text-center text-slate-900">${escapeHtml(c.title)}</h2>` : ''}
        <div class="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${plans}</div>
      </div>
    </section>`;
  },

  Testimonials(c) {
    const items = (c.items || []).map(t => `
      <figure class="p-6 bg-white border border-slate-100" style="border-radius:var(--radius)">
        <blockquote class="text-slate-700 leading-relaxed">&ldquo;${escapeHtml(t.quote)}&rdquo;</blockquote>
        <figcaption class="mt-4 flex items-center gap-3">
          ${t.avatar_url ? `<img src="${safeUrl(t.avatar_url)}" alt="${escapeHtml(t.name)}" class="w-10 h-10 rounded-full object-cover">` : ''}
          <div>
            <div class="font-semibold text-slate-900">${escapeHtml(t.name)}</div>
            <div class="text-sm text-slate-500">${escapeHtml(t.role)}</div>
          </div>
        </figcaption>
      </figure>`).join('');
    return `<section class="py-20 bg-slate-50">
      <div class="max-w-6xl mx-auto px-6">
        ${c.title ? `<h2 class="text-3xl md:text-4xl font-bold text-center text-slate-900">${escapeHtml(c.title)}</h2>` : ''}
        <div class="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${items}</div>
      </div>
    </section>`;
  },

  ContactForm(c, dir, slug, baseUrl) {
    const isRtl = dir === 'rtl';
    const digits = String(c.whatsapp_number || '').replace(/\D/g, '');
    const waHref = digits
      ? `https://wa.me/${digits}?text=${encodeURIComponent(isRtl ? 'مرحبا، أود الاستفسار' : 'Hello, I have a question')}`
      : null;
    const fields = (c.fields || []).map((f, i) => {
      const name = /mail|بريد/i.test(f) ? 'email' : /phone|هاتف|جوال|واتس/i.test(f) ? 'phone' : /name|اسم/i.test(f) ? 'name' : `field_${i}`;
      return `<input name="${name}" placeholder="${escapeHtml(f)}" class="w-full px-4 py-3 border border-slate-200 focus:outline-none focus:border-slate-400" style="border-radius:var(--radius)">`;
    }).join('');
    return `<section id="contact" class="py-20">
      <div class="max-w-3xl mx-auto px-6">
        ${c.title ? `<h2 class="text-3xl md:text-4xl font-bold text-center text-slate-900">${escapeHtml(c.title)}</h2>` : ''}
        <form class="mt-10 space-y-4 js-lead-form" data-slug="${escapeHtml(slug)}" data-api="${escapeHtml(baseUrl)}">
          ${fields}
          <button type="submit" class="w-full py-3 font-semibold text-white" style="background:var(--primary);border-radius:var(--radius)">${isRtl ? 'إرسال' : 'Send'}</button>
          <p class="js-lead-sent hidden text-center py-4 font-semibold text-slate-700">${isRtl ? 'شكراً! تم استلام رسالتك وسنعاود التواصل قريباً.' : 'Thanks! We received your message and will be in touch soon.'}</p>
        </form>
        <div class="mt-6 flex flex-wrap gap-3 justify-center">
          ${waHref ? `<a href="${waHref}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-5 py-3 bg-green-500 text-white font-medium" style="border-radius:var(--radius)">WhatsApp</a>` : ''}
          ${c.email ? `<a href="mailto:${escapeHtml(c.email)}" class="inline-flex items-center gap-2 px-5 py-3 bg-slate-100 text-slate-800 font-medium" style="border-radius:var(--radius)">${escapeHtml(c.email)}</a>` : ''}
        </div>
      </div>
    </section>`;
  },

  FAQAccordion(c) {
    const items = (c.items || []).map(it => `
      <details class="group bg-white border border-slate-200 p-4" style="border-radius:var(--radius)">
        <summary class="font-semibold text-slate-900 flex items-center justify-between cursor-pointer">
          <span>${escapeHtml(it.question)}</span>
          <span class="text-2xl leading-none">+</span>
        </summary>
        <p class="mt-3 text-slate-600 leading-relaxed">${escapeHtml(it.answer)}</p>
      </details>`).join('');
    return `<section class="py-20 bg-slate-50">
      <div class="max-w-3xl mx-auto px-6">
        ${c.title ? `<h2 class="text-3xl md:text-4xl font-bold text-center text-slate-900">${escapeHtml(c.title)}</h2>` : ''}
        <div class="mt-10 space-y-3">${items}</div>
      </div>
    </section>`;
  },

  GalleryGrid(c) {
    const images = (c.images || []).map(img => `<img src="${safeUrl(img.url)}" alt="${escapeHtml(img.alt)}" class="w-full h-48 object-cover" style="border-radius:var(--radius)" loading="lazy">`).join('');
    return `<section class="py-20">
      <div class="max-w-6xl mx-auto px-6">
        ${c.title ? `<h2 class="text-3xl md:text-4xl font-bold text-center text-slate-900">${escapeHtml(c.title)}</h2>` : ''}
        <div class="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">${images}</div>
      </div>
    </section>`;
  },

  StatsBar(c) {
    const items = (c.items || []).map(s => `
      <div>
        <div class="text-4xl md:text-5xl font-bold">${escapeHtml(s.number)}</div>
        <div class="mt-2 text-sm uppercase tracking-wide opacity-80">${escapeHtml(s.label)}</div>
      </div>`).join('');
    return `<section class="py-16" style="background:var(--primary)">
      <div class="max-w-6xl mx-auto px-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">${items}</div>
      </div>
    </section>`;
  },

  TeamSection(c) {
    const members = (c.members || []).map(m => `
      <div class="p-6 bg-white border border-slate-100 text-center" style="border-radius:var(--radius)">
        ${m.photo_url ? `<img src="${safeUrl(m.photo_url)}" alt="${escapeHtml(m.name)}" class="mx-auto w-24 h-24 rounded-full object-cover">` : ''}
        <h3 class="mt-4 text-lg font-semibold text-slate-900">${escapeHtml(m.name)}</h3>
        <div class="text-sm text-slate-500">${escapeHtml(m.role)}</div>
        <p class="mt-3 text-slate-600 text-sm leading-relaxed">${escapeHtml(m.bio)}</p>
      </div>`).join('');
    return `<section class="py-20 bg-slate-50">
      <div class="max-w-6xl mx-auto px-6">
        ${c.title ? `<h2 class="text-3xl md:text-4xl font-bold text-center text-slate-900">${escapeHtml(c.title)}</h2>` : ''}
        <div class="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${members}</div>
      </div>
    </section>`;
  },

  FooterSection(c) {
    const links = (c.links || []).map(l => `<a href="${safeUrl(l.url)}" class="hover:text-white transition">${escapeHtml(l.label)}</a>`).join('');
    const social = (c.social || []).map(s => `<a href="${safeUrl(s.url)}" target="_blank" rel="noopener noreferrer" class="px-3 py-1 bg-slate-800 hover:bg-slate-700" style="border-radius:var(--radius)">${escapeHtml(s.platform)}</a>`).join('');
    return `<footer class="py-12 bg-slate-900 text-slate-200">
      <div class="max-w-6xl mx-auto px-6 grid gap-8 md:grid-cols-3 items-start">
        <div><div class="text-2xl font-bold text-white">${escapeHtml(c.logo_text)}</div></div>
        <nav class="flex flex-wrap gap-x-6 gap-y-2 text-sm">${links}</nav>
        <div class="flex md:justify-end gap-3 text-sm">${social}</div>
      </div>
      <div class="mt-10 text-center text-xs text-slate-400">${escapeHtml(c.copyright)}</div>
    </footer>`;
  },
};

const LEAD_FORM_SCRIPT = `
<script>
document.querySelectorAll('.js-lead-form').forEach(function (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = {};
    Array.from(form.elements).forEach(function (el) { if (el.name && el.value) data[el.name] = el.value; });
    fetch(form.dataset.api + '/api/leads/' + form.dataset.slug, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: location.pathname, fields: data }),
    }).catch(function () {});
    Array.from(form.elements).forEach(function (el) { el.style.display = 'none'; });
    var sent = form.querySelector('.js-lead-sent');
    if (sent) sent.classList.remove('hidden');
  });
});
</script>`;

// Renders a full Blueprint into a self-contained HTML document. `slug` and
// `baseUrl` (the backend's public origin) wire up the contact form's lead
// capture to POST /api/leads/:slug, matching the real renderer's behavior.
export function renderBlueprintToHtml(blueprint, { slug, baseUrl } = {}) {
  const theme = blueprint.theme || {};
  const primary = theme.primary_color || '#1e40af';
  const secondary = theme.secondary_color || '#f59e0b';
  const radius = radiusToCss(theme.border_radius);
  const fontFamily = theme.font_family ? `'${theme.font_family}', system-ui, sans-serif` : 'system-ui, sans-serif';
  const fontHref = googleFontHref(theme.font_family);
  const dir = blueprint.direction === 'rtl' ? 'rtl' : 'ltr';
  const lang = blueprint.language || 'en';

  const body = (blueprint.blocks || [])
    .map(b => {
      const renderer = BLOCK_RENDERERS[b.type];
      if (!renderer) return '';
      return renderer(b.content || {}, dir, slug, baseUrl);
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(blueprint.project_name)}</title>
${fontHref ? `<link rel="stylesheet" href="${fontHref}">` : ''}
<script src="https://cdn.tailwindcss.com"></script>
<style>
  :root { --primary: ${primary}; --secondary: ${secondary}; --radius: ${radius}; }
  body { font-family: ${fontFamily}; }
</style>
</head>
<body class="bg-white text-slate-900">
${body}
${LEAD_FORM_SCRIPT}
</body>
</html>`;
}
