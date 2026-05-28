export function FAQAccordion({ content }) {
  const { title, items = [] } = content;
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-3xl mx-auto px-6">
        {title && <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900">{title}</h2>}
        <div className="mt-10 space-y-3">
          {items.map((it, i) => (
            <details
              key={i}
              className="group bg-white border border-slate-200 p-4 [&_summary]:cursor-pointer"
              style={{ borderRadius: 'var(--radius)' }}
            >
              <summary className="font-semibold text-slate-900 flex items-center justify-between">
                <span>{it.question}</span>
                <span className="text-2xl leading-none group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-slate-600 leading-relaxed">{it.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
