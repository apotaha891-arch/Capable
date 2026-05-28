import * as Icons from 'lucide-react';

function toPascal(name) {
  return String(name || 'Star')
    .split(/[-_\s]/)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

export function FeaturesGrid({ content }) {
  const { title, items = [] } = content;
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        {title && <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900">{title}</h2>}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((it, i) => {
            const Icon = Icons[toPascal(it.icon)] || Icons.Star;
            return (
              <div
                key={i}
                className="p-6 bg-white shadow-sm border border-slate-100"
                style={{ borderRadius: 'var(--radius)' }}
              >
                <Icon className="w-10 h-10" style={{ color: 'var(--primary)' }} />
                <h3 className="mt-4 text-xl font-semibold text-slate-900">{it.title}</h3>
                <p className="mt-2 text-slate-600 leading-relaxed">{it.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
