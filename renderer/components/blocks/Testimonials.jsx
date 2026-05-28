export function Testimonials({ content }) {
  const { title, items = [] } = content;
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        {title && <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900">{title}</h2>}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((t, i) => (
            <figure
              key={i}
              className="p-6 bg-white border border-slate-100"
              style={{ borderRadius: 'var(--radius)' }}
            >
              <blockquote className="text-slate-700 leading-relaxed">“{t.quote}”</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                {t.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.avatar_url} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                )}
                <div>
                  <div className="font-semibold text-slate-900">{t.name}</div>
                  <div className="text-sm text-slate-500">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
