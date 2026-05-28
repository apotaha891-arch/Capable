import { Check } from 'lucide-react';

export function PricingTable({ content }) {
  const { title, plans = [] } = content;
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        {title && <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900">{title}</h2>}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <div
              key={i}
              className="p-8 bg-white border-2 border-slate-100 flex flex-col"
              style={{ borderRadius: 'var(--radius)' }}
            >
              <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
              <div className="mt-4 text-4xl font-bold" style={{ color: 'var(--primary)' }}>
                {plan.price}
              </div>
              <ul className="mt-6 space-y-3 flex-1">
                {(plan.features || []).map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-slate-700">
                    <Check className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                className="mt-8 w-full py-3 font-semibold text-white"
                style={{ background: 'var(--primary)', borderRadius: 'var(--radius)' }}
              >
                {plan.cta_text}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
