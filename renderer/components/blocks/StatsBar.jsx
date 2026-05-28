export function StatsBar({ content }) {
  const { items = [] } = content;
  return (
    <section className="py-16" style={{ background: 'var(--primary)' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          {items.map((s, i) => (
            <div key={i}>
              <div className="text-4xl md:text-5xl font-bold">{s.number}</div>
              <div className="mt-2 text-sm uppercase tracking-wide opacity-80">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
