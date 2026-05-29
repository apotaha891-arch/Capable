import React, { useState, useEffect } from 'react';
import { Bell, Mail, Send, Megaphone, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner, tt } from './AdminShared.jsx';

const AUDIENCES = (lang) => [
  ['all', tt(lang, 'All users', 'كل المستخدمين')],
  ['free', tt(lang, 'Free plan', 'الخطة المجانية')],
  ['paying', tt(lang, 'Paying users', 'المدفوعون')],
  ['pro', 'Pro'],
  ['enterprise', 'Enterprise'],
];

export default function CrmTab({ lang }) {
  const { authFetch } = useAuth();
  const [campaigns, setCampaigns] = useState(null);
  const [mailModeName, setMailModeName] = useState('simulated');

  // notification form
  const [nTitle, setNTitle] = useState('');
  const [nBody, setNBody] = useState('');
  const [nAudience, setNAudience] = useState('all');
  const [nType, setNType] = useState('info');
  const [nMsg, setNMsg] = useState('');

  // campaign form
  const [cSubject, setCSubject] = useState('');
  const [cBody, setCBody] = useState('');
  const [cAudience, setCAudience] = useState('all');
  const [sending, setSending] = useState(false);

  const load = () => authFetch('/api/admin/campaigns').then(r => r.json())
    .then(d => { setCampaigns(d.campaigns); setMailModeName(d.mailMode); })
    .catch(() => setCampaigns([]));
  useEffect(() => { load(); }, []);

  const sendNotification = async (e) => {
    e.preventDefault();
    setNMsg('');
    const res = await authFetch('/api/admin/notifications', {
      method: 'POST',
      body: JSON.stringify({ title: nTitle, body: nBody, type: nType, audience: nAudience }),
    });
    const d = await res.json();
    setNMsg(tt(lang, `Sent to ${d.sent} users ✓`, `أُرسل إلى ${d.sent} مستخدم ✓`));
    setNTitle(''); setNBody('');
  };

  const sendCampaign = async (e) => {
    e.preventDefault();
    setSending(true);
    await authFetch('/api/admin/campaigns', {
      method: 'POST',
      body: JSON.stringify({ subject: cSubject, body: cBody, audience: cAudience }),
    });
    setCSubject(''); setCBody('');
    setSending(false);
    load();
  };

  const auds = AUDIENCES(lang);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* In-app notification */}
      <form onSubmit={sendNotification} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2"><Bell size={15} className="text-indigo-400" /> {tt(lang, 'Push In-App Notification', 'إرسال إشعار داخل التطبيق')}</h3>
        <input required value={nTitle} onChange={e => setNTitle(e.target.value)} placeholder={tt(lang, 'Title', 'العنوان')}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
        <textarea value={nBody} onChange={e => setNBody(e.target.value)} rows={3} placeholder={tt(lang, 'Message…', 'الرسالة…')}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none" />
        <div className="flex gap-2">
          <select value={nAudience} onChange={e => setNAudience(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none">
            {auds.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={nType} onChange={e => setNType(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none">
            {['info', 'success', 'warning', 'promo'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
          <Megaphone size={15} /> {tt(lang, 'Broadcast', 'بثّ')}
        </button>
        {nMsg && <p className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 size={13} /> {nMsg}</p>}
      </form>

      {/* Email campaign */}
      <form onSubmit={sendCampaign} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Mail size={15} className="text-cyan-400" /> {tt(lang, 'Email Campaign', 'حملة بريدية')}</h3>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
            {mailModeName === 'smtp' ? 'SMTP' : tt(lang, 'simulated', 'محاكاة')}
          </span>
        </div>
        <input required value={cSubject} onChange={e => setCSubject(e.target.value)} placeholder={tt(lang, 'Subject', 'الموضوع')}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
        <textarea value={cBody} onChange={e => setCBody(e.target.value)} rows={3} placeholder={tt(lang, 'Email body…', 'نص الرسالة…')}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none" />
        <select value={cAudience} onChange={e => setCAudience(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none">
          {auds.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button disabled={sending} className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
          <Send size={15} /> {sending ? tt(lang, 'Sending…', 'جارٍ الإرسال…') : tt(lang, 'Send Campaign', 'إرسال الحملة')}
        </button>
      </form>

      {/* Campaign history */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">{tt(lang, 'Campaign History', 'سجل الحملات')}</h3>
        {campaigns == null ? <Spinner /> : campaigns.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">{tt(lang, 'No campaigns sent yet.', 'لم تُرسل حملات بعد.')}</p>
        ) : (
          <div className="space-y-2">
            {campaigns.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-3 bg-slate-800/40 rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <div className="font-medium text-white truncate">{c.subject}</div>
                  <div className="text-xs text-slate-500">{c.audience} · {new Date(c.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-4 text-xs shrink-0">
                  <span className="text-slate-300">{c.recipient_count} {tt(lang, 'sent', 'مُرسل')}</span>
                  <span className="text-emerald-400">{c.opened_count} {tt(lang, 'opened', 'فُتح')}</span>
                  <span className="text-slate-500">
                    {c.recipient_count ? Math.round((c.opened_count / c.recipient_count) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
