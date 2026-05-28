export function GalleryGrid({ content }) {
  const { title, images = [] } = content;
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        {title && <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900">{title}</h2>}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={img.url}
              alt={img.alt || ''}
              className="w-full h-48 object-cover"
              style={{ borderRadius: 'var(--radius)' }}
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
