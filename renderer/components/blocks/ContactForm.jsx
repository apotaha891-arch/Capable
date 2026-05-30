'use client';

import { useState } from 'react';
import { MessageCircle, Mail } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_CAPABLE_API_URL || 'http://localhost:5000';

// Best-effort slug from the published subdomain (slug.capable.app).
function currentSlug() {
  if (typeof window === 'undefined') return null;
  const parts = window.location.hostname.split('.');
  return parts.length > 2 ? parts[0] : null;
}

export function ContactForm({ content, direction }) {
  const { title, fields = [], whatsapp_number, email } = content;
  const isRtl = direction === 'rtl';
  const [sent, setSent] = useState(false);

  const waHref = whatsapp_number
    ? `https://wa.me/${String(whatsapp_number).replace(/\D/g, '')}?text=${encodeURIComponent(isRtl ? 'مرحبا، أود الاستفسار' : 'Hello, I have a question')}`
    : null;

  // Capture the submission as a lead in the owner control panel.
  const onSubmit = (e) => {
    e.preventDefault();
    const slug = currentSlug();
    const data = {};
    Array.from(e.target.elements).forEach(el => { if (el.name && el.value) data[el.name] = el.value; });
    if (slug) {
      fetch(`${API_BASE}/api/leads/${slug}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: window.location.pathname, fields: data }),
      }).catch(() => {});
    }
    setSent(true);
  };

  return (
    <section id="contact" className="py-20">
      <div className="max-w-3xl mx-auto px-6">
        {title && <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900">{title}</h2>}
        {sent ? (
          <div className="mt-10 text-center py-10 text-lg font-semibold text-slate-700" style={{ borderRadius: 'var(--radius)' }}>
            {isRtl ? 'شكراً! تم استلام رسالتك وسنعاود التواصل قريباً.' : 'Thanks! We received your message and will be in touch soon.'}
          </div>
        ) : (
        <form className="mt-10 space-y-4" onSubmit={onSubmit}>
          {fields.map((f, i) => (
            <input
              key={i}
              name={/mail|بريد/i.test(f) ? 'email' : /phone|هاتف|جوال|واتس/i.test(f) ? 'phone' : /name|اسم/i.test(f) ? 'name' : `field_${i}`}
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
        )}
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
