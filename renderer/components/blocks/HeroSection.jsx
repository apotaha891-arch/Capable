export function HeroSection({ content }) {
  const { title, subtitle, cta_text, cta_url, background_style = 'gradient' } = content;
  const bg =
    background_style === 'solid'
      ? { background: 'var(--primary)' }
      : background_style === 'image'
      ? { background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }
      : { background: 'linear-gradient(135deg, var(--primary), var(--secondary))' };

  return (
    <section className="relative py-24 md:py-32 text-white" style={bg}>
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight">{title}</h1>
        {subtitle && <p className="mt-6 text-lg md:text-2xl opacity-90">{subtitle}</p>}
        {cta_text && (
          <a
            href={cta_url || '#'}
            className="inline-block mt-10 px-8 py-4 bg-white text-slate-900 font-semibold shadow-lg hover:shadow-xl transition"
            style={{ borderRadius: 'var(--radius)' }}
          >
            {cta_text}
          </a>
        )}
      </div>
    </section>
  );
}
