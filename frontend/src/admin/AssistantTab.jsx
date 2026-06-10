import React, { useState, useEffect } from 'react';
import { MessageSquare, CalendarClock, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner, tt } from './AdminShared.jsx';

export default function AssistantTab({ lang }) {
  const { authFetch } = useAuth();
  const [leads, setLeads] = useState(null);
  const [convos, setConvos] = useState(null);
  const [transcript, setTranscript] = useState(null); // { sessionId, messages }

  useEffect(() => {
    authFetch('/api/admin/assistant/leads').then(r => r.json()).then(d => setLeads(Array.isArray(d) ? d : [])).catch(() => setLeads([]));
    authFetch('/api/admin/assistant/conversations').then(r => r.json()).then(d => setConvos(Array.isArray(d) ? d : [])).catch(() => setConvos([]));
  }, []);

  const openTranscript = async (sid) => {
    setTranscript({ sessionId: sid, messages: null });
    const r = await authFetch(`/api/admin/assistant/conversations/${encodeURIComponent(sid)}`);
    const m = await r.json().catch(() => []);
    setTranscript({ sessionId: sid, messages: Array.isArray(m) ? m : [] });
  };

  const fmt = (d) => (d ? new Date(d).toLocaleString() : '');

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <CalendarClock size={16} className="text-emerald-400" /> {tt(lang, 'Leads & bookings', 'العملاء والحجوزات')}
        </h3>
        {leads == null ? <Spinner /> : leads.length === 0 ? (
          <p className="text-sm text-slate-500">{tt(lang, 'No leads yet.', 'لا توجد طلبات بعد.')}</p>
        ) : (
          <div className="rounded-2xl border border-slate-800 overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead><tr className="bg-slate-800/60 text-slate-300">
                <th className="text-start px-3 py-2 font-medium">{tt(lang, 'Name', 'الاسم')}</th>
                <th className="text-start px-3 py-2 font-medium">{tt(lang, 'Contact', 'التواصل')}</th>
                <th className="text-start px-3 py-2 font-medium">{tt(lang, 'Message', 'الرسالة')}</th>
                <th className="text-start px-3 py-2 font-medium">{tt(lang, 'Session?', 'جلسة؟')}</th>
                <th className="text-start px-3 py-2 font-medium">{tt(lang, 'When', 'التاريخ')}</th>
              </tr></thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-t border-slate-800 text-slate-300">
                    <td className="px-3 py-2">{l.name || '—'}</td>
                    <td className="px-3 py-2 text-cyan-300">{l.contact}</td>
                    <td className="px-3 py-2 max-w-[220px] truncate" title={l.message || ''}>{l.message || '—'}</td>
                    <td className="px-3 py-2">{l.wants_session ? '✅' : '—'}</td>
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{fmt(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <MessageSquare size={16} className="text-indigo-400" /> {tt(lang, 'Assistant conversations', 'محادثات المساعد')}
        </h3>
        {convos == null ? <Spinner /> : convos.length === 0 ? (
          <p className="text-sm text-slate-500">{tt(lang, 'No conversations yet.', 'لا توجد محادثات بعد.')}</p>
        ) : (
          <div className="space-y-2">
            {convos.map((c) => (
              <button key={c.session_id} onClick={() => openTranscript(c.session_id)} className="w-full text-start rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 p-3 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-slate-200 truncate flex-1">{c.first_message || '—'}</div>
                  <span className="text-xs text-slate-500 shrink-0">{c.message_count} {tt(lang, 'msgs', 'رسالة')} · {fmt(c.last_at)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {transcript && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setTranscript(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white">{tt(lang, 'Transcript', 'نص المحادثة')}</h4>
              <button onClick={() => setTranscript(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {transcript.messages == null ? <Spinner /> : transcript.messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] text-sm px-3 py-2 rounded-2xl whitespace-pre-wrap ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200'}`}>{m.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
