'use client';

import { MessageCircle, Mail } from 'lucide-react';

export function ContactForm({ content, direction }) {
  const { title, fields = [], whatsapp_number, email } = content;
  const isRtl = direction === 'rtl';

  const waHref = whatsapp_number
    ? `https://wa.me/${String(whatsapp_number).replace(/\D/g, '')}?text=${encodeURIComponent(isRtl ? 'مرحبا، أود الاستفسار' : 'Hello, I have a question')}`
    : null;

  return (
    <section id="contact" className="py-20">
      <div className="max-w-3xl mx-auto px-6">
        {title && <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900">{title}</h2>}
        <form className="mt-10 space-y-4" onSubmit={e => e.preventDefault()}>
          {fields.map((f, i) => (
            <input
              key={i}
              placeholder={f}
              className="w-full px-4 py-3 border border-slate-200 focus:outline-none focus:border-slate-400"
              style={{ borderRadius: 'var(--radius)' }}
            />
          ))}
          <button
            type="submit"
            className="w-full py-3 font-semibold text-white"
            style={{ background: 'var(--primary)', borderRadius: 'var(--radius)' }}
          >
            {isRtl ? 'إرسال' : 'Send'}
          </button>
        </form>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-green-500 text-white font-medium"
              style={{ borderRadius: 'var(--radius)' }}
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-2 px-5 py-3 bg-slate-100 text-slate-800 font-medium"
              style={{ borderRadius: 'var(--radius)' }}
            >
              <Mail className="w-5 h-5" />
              {email}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
