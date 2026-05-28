// Frontend preview mirror of the renderer block components.
// Kept visually faithful so the editor preview matches production output.
import React from 'react';
import * as Icons from 'lucide-react';
import { MessageCircle, Mail, Check } from 'lucide-react';

function toPascal(name) {
  return String(name || 'Star')
    .split(/[-_\s]/)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

function HeroSection({ content }) {
  const { title, subtitle, cta_text, cta_url } = content;
  return (
    <section className="relative py-24 text-white text-center" style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight">{title}</h1>
        {subtitle && <p className="mt-6 text-lg md:text-2xl opacity-90">{subtitle}</p>}
        {cta_text && (
          <a href={cta_url || '#'} className="inline-block mt-10 px-8 py-4 bg-white text-slate-900 font-semibold shadow-lg" style={{ borderRadius: 'var(--radius)' }}>{cta_text}</a>
        )}
      </div>
    </section>
  );
}

function FeaturesGrid({ content }) {
  const { title, items = [] } = content;
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        {title && <h2 className="text-3xl font-bold text-center text-slate-900">{title}</h2>}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((it, i) => {
            const Icon = Icons[toPascal(it.icon)] || Icons.Star;
            return (
              <div key={i} className="p-6 bg-white shadow-sm border border-slate-100" style={{ borderRadius: 'var(--radius)' }}>
                <Icon className="w-10 h-10" style={{ color: 'var(--primary)' }} />
                <h3 className="mt-4 text-xl font-semibold text-slate-900">{it.title}</h3>
                <p className="mt-2 text-slate-600">{it.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PricingTable({ content }) {
  const { title, plans = [] } = content;
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        {title && <h2 className="text-3xl font-bold text-center text-slate-900">{title}</h2>}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <div key={i} className="p-8 bg-white border-2 border-slate-100 flex flex-col" style={{ borderRadius: 'var(--radius)' }}>
              <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
              <div className="mt-4 text-4xl font-bold" style={{ color: 'var(--primary)' }}>{plan.price}</div>
              <ul className="mt-6 space-y-3 flex-1">
                {(plan.features || []).map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-slate-700"><Check className="w-5 h-5 mt-0.5" style={{ color: 'var(--primary)' }} /><span>{f}</span></li>
                ))}
              </ul>
              <button className="mt-8 w-full py-3 font-semibold text-white" style={{ background: 'var(--primary)', borderRadius: 'var(--radius)' }}>{plan.cta_text}</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials({ content }) {
  const { title, items = [] } = content;
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        {title && <h2 className="text-3xl font-bold text-center text-slate-900">{title}</h2>}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((t, i) => (
            <figure key={i} className="p-6 bg-white border border-slate-100" style={{ borderRadius: 'var(--radius)' }}>
              <blockquote className="text-slate-700">“{t.quote}”</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                {t.avatar_url && <img src={t.avatar_url} alt={t.name} className="w-10 h-10 rounded-full object-cover" />}
                <div><div className="font-semibold text-slate-900">{t.name}</div><div className="text-sm text-slate-500">{t.role}</div></div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactForm({ content }) {
  const { title, fields = [], whatsapp_number, email } = content;
  return (
    <section className="py-20">
      <div className="max-w-3xl mx-auto px-6">
        {title && <h2 className="text-3xl font-bold text-center text-slate-900">{title}</h2>}
        <form className="mt-10 space-y-4" onSubmit={e => e.preventDefault()}>
          {fields.map((f, i) => (
            <input key={i} placeholder={f} className="w-full px-4 py-3 border border-slate-200" style={{ borderRadius: 'var(--radius)' }} />
          ))}
          <button type="submit" className="w-full py-3 font-semibold text-white" style={{ background: 'var(--primary)', borderRadius: 'var(--radius)' }}>Send</button>
        </form>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          {whatsapp_number && <span className="inline-flex items-center gap-2 px-5 py-3 bg-green-500 text-white" style={{ borderRadius: 'var(--radius)' }}><MessageCircle className="w-5 h-5" />WhatsApp</span>}
          {email && <span className="inline-flex items-center gap-2 px-5 py-3 bg-slate-100 text-slate-800" style={{ borderRadius: 'var(--radius)' }}><Mail className="w-5 h-5" />{email}</span>}
        </div>
      </div>
    </section>
  );
}

function FAQAccordion({ content }) {
  const { title, items = [] } = content;
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-3xl mx-auto px-6">
        {title && <h2 className="text-3xl font-bold text-center text-slate-900">{title}</h2>}
        <div className="mt-10 space-y-3">
          {items.map((it, i) => (
            <details key={i} className="group bg-white border border-slate-200 p-4" style={{ borderRadius: 'var(--radius)' }}>
              <summary className="font-semibold text-slate-900 cursor-pointer flex items-center justify-between"><span>{it.question}</span><span className="text-2xl group-open:rotate-45 transition-transform">+</span></summary>
              <p className="mt-3 text-slate-600">{it.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function GalleryGrid({ content }) {
  const { title, images = [] } = content;
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        {title && <h2 className="text-3xl font-bold text-center text-slate-900">{title}</h2>}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map((img, i) => <img key={i} src={img.url} alt={img.alt || ''} className="w-full h-48 object-cover" style={{ borderRadius: 'var(--radius)' }} loading="lazy" />)}
        </div>
      </div>
    </section>
  );
}

function StatsBar({ content }) {
  const { items = [] } = content;
  return (
    <section className="py-16" style={{ background: 'var(--primary)' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          {items.map((s, i) => <div key={i}><div className="text-4xl md:text-5xl font-bold">{s.number}</div><div className="mt-2 text-sm uppercase tracking-wide opacity-80">{s.label}</div></div>)}
        </div>
      </div>
    </section>
  );
}

function TeamSection({ content }) {
  const { title, members = [] } = content;
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        {title && <h2 className="text-3xl font-bold text-center text-slate-900">{title}</h2>}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {members.map((m, i) => (
            <div key={i} className="p-6 bg-white border border-slate-100 text-center" style={{ borderRadius: 'var(--radius)' }}>
              {m.photo_url && <img src={m.photo_url} alt={m.name} className="mx-auto w-24 h-24 rounded-full object-cover" />}
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{m.name}</h3>
              <div className="text-sm text-slate-500">{m.role}</div>
              <p className="mt-3 text-slate-600 text-sm">{m.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FooterSection({ content }) {
  const { logo_text, links = [], social = [], copyright } = content;
  return (
    <footer className="py-12 bg-slate-900 text-slate-200">
      <div className="max-w-6xl mx-auto px-6 grid gap-8 md:grid-cols-3 items-start">
        <div className="text-2xl font-bold text-white">{logo_text}</div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">{links.map((l, i) => <a key={i} href={l.url} className="hover:text-white">{l.label}</a>)}</nav>
        <div className="flex md:justify-end gap-3 text-sm">{social.map((s, i) => <a key={i} href={s.url} className="px-3 py-1 bg-slate-800" style={{ borderRadius: 'var(--radius)' }}>{s.platform}</a>)}</div>
      </div>
      <div className="mt-10 text-center text-xs text-slate-400">{copyright}</div>
    </footer>
  );
}

export const BLOCK_MAP = {
  HeroSection, FeaturesGrid, PricingTable, Testimonials, ContactForm,
  FAQAccordion, GalleryGrid, StatsBar, TeamSection, FooterSection,
};
