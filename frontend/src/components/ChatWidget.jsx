import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLang } from '../i18n/LangContext.jsx';
import { API_BASE as API } from '../utils/api.js';

// Persistent per-visitor session id so transcripts group in the admin panel.
function getSessionId() {
  try {
    let s = localStorage.getItem('capable_assistant_sid');
    if (!s) { s = 's_' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('capable_assistant_sid', s); }
    return s;
  } catch { return 's_' + Date.now().toString(36); }
}

function Bubble({ role, text }) {
  const me = role === 'user';
  return (
    <div className={`flex ${me ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[82%] text-sm leading-relaxed px-3 py-2 rounded-2xl whitespace-pre-wrap ${me
        ? 'bg-capable-navy text-white'
        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700'}`}>{text}</div>
    </div>
  );
}

// Floating site assistant — answers from the guide and captures leads/bookings.
export default function ChatWidget() {
  const { lang, isRTL } = useLang();
  const ar = lang === 'ar';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLead, setShowLead] = useState(false);
  const [leadSent, setLeadSent] = useState(false);
  const [lead, setLead] = useState({ name: '', contact: '', message: '', wants_session: false });
  const endRef = useRef(null);
  const sessionId = useRef(getSessionId());

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading, open, showLead, leadSent]);

  const greeting = ar
    ? 'أهلاً! أنا مساعد كيبابل 👋 اسألني أي شيء عن المنصة، أو اطلب التواصل مع خبير.'
    : "Hi! I'm Capable's assistant 👋 Ask me anything about the platform, or ask to talk to an expert.";

  const inputCls = 'w-full text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-capable-light';

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next); setInput(''); setLoading(true);
    try {
      const res = await fetch(`${API}/api/assistant/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId.current, messages: next }),
      });
      const data = await res.json().catch(() => ({}));
      setMessages([...next, { role: 'assistant', content: (res.ok && data.reply) ? data.reply : (ar ? 'عذراً، حدث خطأ مؤقّت. حاول مجدداً.' : 'Sorry, a temporary error occurred. Please try again.') }]);
    } catch {
      setMessages([...next, { role: 'assistant', content: ar ? 'تعذّر الاتصال. حاول مجدداً.' : 'Connection failed. Please try again.' }]);
    } finally { setLoading(false); }
  };

  const submitLead = async (e) => {
    e.preventDefault();
    if (!lead.contact.trim()) return;
    try {
      const res = await fetch(`${API}/api/assistant/lead`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lead, session_id: sessionId.current }),
      });
      if (res.ok) { setLeadSent(true); setShowLead(false); setLead({ name: '', contact: '', message: '', wants_session: false }); }
    } catch { /* non-fatal */ }
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="fixed bottom-5 end-5 z-[9999] flex flex-col items-end font-sans">
      {open && (
        <div className="mb-3 w-[min(92vw,370px)] h-[min(72vh,540px)] rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-capable-navy text-white shrink-0">
            <div className="flex items-center gap-2 text-sm font-bold"><Sparkles size={16} /> {ar ? 'مساعد كيبابل' : 'Capable Assistant'}</div>
            <button onClick={() => setOpen(false)} className="opacity-80 hover:opacity-100"><X size={18} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50 dark:bg-slate-950">
            <Bubble role="assistant" text={greeting} />
            {messages.map((m, i) => <Bubble key={i} role={m.role} text={m.content} />)}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl px-3 py-2">
                  <span className="flex gap-1">
                    {[0, 150, 300].map((d) => <span key={d} className="w-1.5 h-1.5 rounded-full bg-capable-light animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                  </span>
                </div>
              </div>
            )}
            {leadSent && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 justify-center py-1">
                <CheckCircle2 size={13} /> {ar ? 'تم استلام طلبك — سنتواصل معك قريباً.' : "Got it — we'll reach out soon."}
              </div>
            )}
            <div ref={endRef} />
          </div>

          {showLead ? (
            <form onSubmit={submitLead} className="p-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-2 shrink-0">
              <input value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} placeholder={ar ? 'الاسم' : 'Name'} className={inputCls} />
              <input required value={lead.contact} onChange={(e) => setLead({ ...lead, contact: e.target.value })} placeholder={ar ? 'بريدك الإلكتروني أو هاتفك' : 'Email or phone'} className={inputCls} />
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <input type="checkbox" checked={lead.wants_session} onChange={(e) => setLead({ ...lead, wants_session: e.target.checked })} />
                {ar ? 'أريد حجز جلسة مع خبير' : 'Book a session with an expert'}
              </label>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-capable-navy hover:bg-capable-medium text-white text-sm font-semibold py-2 rounded-lg transition-colors">{ar ? 'إرسال' : 'Send'}</button>
                <button type="button" onClick={() => setShowLead(false)} className="text-sm px-3 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">{ar ? 'رجوع' : 'Back'}</button>
              </div>
            </form>
          ) : (
            <div className="p-2.5 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={ar ? 'اكتب رسالتك…' : 'Type a message…'} className={inputCls} />
                <button onClick={send} disabled={loading || !input.trim()} className="bg-capable-navy hover:bg-capable-medium text-white p-2 rounded-lg disabled:opacity-50 shrink-0 transition-colors">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className={isRTL ? 'rotate-180' : ''} />}
                </button>
              </div>
              <button onClick={() => { setShowLead(true); setLeadSent(false); }} className="mt-2 w-full text-xs font-medium text-capable-navy dark:text-indigo-300 hover:underline">
                {ar ? 'تواصل معنا / احجز جلسة مع خبير' : 'Talk to us / book a session'}
              </button>
            </div>
          )}
        </div>
      )}

      <button onClick={() => setOpen((o) => !o)} aria-label="assistant" className="flex items-center justify-center w-14 h-14 rounded-full bg-capable-navy text-white shadow-xl hover:bg-capable-medium transition-colors">
        {open ? <X size={22} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
