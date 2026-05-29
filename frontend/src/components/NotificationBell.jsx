import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../i18n/LangContext.jsx';

const TYPE_DOT = {
  info: 'bg-indigo-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  promo: 'bg-fuchsia-400',
};

export default function NotificationBell() {
  const { authFetch } = useAuth();
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const load = () => authFetch('/api/notifications').then(r => r.json())
    .then(d => { setItems(d.notifications || []); setUnread(d.unread || 0); })
    .catch(() => {});

  useEffect(() => {
    load();
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markAll = async () => {
    await authFetch('/api/notifications/read', { method: 'POST', body: JSON.stringify({}) });
    setUnread(0);
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) markAll();
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} className="relative text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -end-0.5 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 mt-2 w-80 max-h-96 overflow-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 sticky top-0 bg-slate-900">
            <span className="text-sm font-bold text-white">{t('notifications')}</span>
            {items.length > 0 && (
              <button onClick={markAll} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                <CheckCheck size={13} /> {t('markAllRead')}
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">{t('noNotifications')}</p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {items.map(n => (
                <li key={n.id} className={`px-4 py-3 ${n.is_read ? '' : 'bg-slate-800/30'}`}>
                  <div className="flex items-start gap-2.5">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${TYPE_DOT[n.type] || TYPE_DOT.info}`} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white">{n.title}</div>
                      {n.body && <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{n.body}</div>}
                      <div className="text-[10px] text-slate-600 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
