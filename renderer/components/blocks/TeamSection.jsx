export function TeamSection({ content }) {
  const { title, members = [] } = content;
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        {title && <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900">{title}</h2>}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((m, i) => (
            <div
              key={i}
              className="p-6 bg-white border border-slate-100 text-center"
              style={{ borderRadius: 'var(--radius)' }}
            >
              {m.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.photo_url}
                  alt={m.name}
                  className="mx-auto w-24 h-24 rounded-full object-cover"
                />
              )}
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{m.name}</h3>
              <div className="text-sm text-slate-500">{m.role}</div>
              <p className="mt-3 text-slate-600 text-sm leading-relaxed">{m.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
