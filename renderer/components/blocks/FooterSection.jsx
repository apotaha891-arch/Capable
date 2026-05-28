export function FooterSection({ content }) {
  const { logo_text, links = [], social = [], copyright } = content;
  return (
    <footer className="py-12 bg-slate-900 text-slate-200">
      <div className="max-w-6xl mx-auto px-6 grid gap-8 md:grid-cols-3 items-start">
        <div>
          <div className="text-2xl font-bold text-white">{logo_text}</div>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {links.map((l, i) => (
            <a key={i} href={l.url} className="hover:text-white transition">{l.label}</a>
          ))}
        </nav>
        <div className="flex md:justify-end gap-3 text-sm">
          {social.map((s, i) => (
            <a
              key={i}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700"
              style={{ borderRadius: 'var(--radius)' }}
            >
              {s.platform}
            </a>
          ))}
        </div>
      </div>
      <div className="mt-10 text-center text-xs text-slate-400">{copyright}</div>
    </footer>
  );
}
