import React from 'react';
import { Copy } from 'lucide-react';

export default function DnsRow({ label, host, value, onCopy }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs">
      <div className="grid grid-cols-[60px_1fr_auto] items-center gap-3">
        <span className="font-bold text-indigo-500 dark:text-indigo-300 font-mono">{label}</span>
        <div className="min-w-0">
          <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">Host</div>
          <div className="text-slate-700 dark:text-slate-200 font-mono truncate">{host}</div>
        </div>
        <button onClick={() => onCopy(host)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Copy host">
          <Copy size={12} />
        </button>
      </div>
      <div className="grid grid-cols-[60px_1fr_auto] items-center gap-3 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
        <span></span>
        <div className="min-w-0">
          <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">Value</div>
          <div className="text-slate-700 dark:text-slate-200 font-mono truncate">{value}</div>
        </div>
        <button onClick={() => onCopy(value)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Copy value">
          <Copy size={12} />
        </button>
      </div>
    </div>
  );
}
