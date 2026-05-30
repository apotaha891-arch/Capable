import React from 'react';

// Bilingual inline helper — admin uses this instead of bloating i18n files.
export const tt = (lang, en, ar) => (lang === 'ar' ? ar : en);

export const money = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('en-US');

// KPI card
export function StatCard({ icon, label, value, sub, tone = 'indigo' }) {
  const tones = {
    indigo: 'text-indigo-400 bg-indigo-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    rose: 'text-rose-400 bg-rose-500/10',
    cyan: 'text-cyan-400 bg-cyan-500/10',
  };
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-400">{label}</span>
        {icon && <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${tones[tone]}`}>{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub != null && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Grouped monthly bar chart (income / expense), pure SVG. Projected months are
// rendered with reduced opacity + dashed outline.
export function BarChart({ data, lang }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(1, ...data.map(d => Math.max(d.income, d.expense)));
  const H = 150;
  const barW = 14;
  const groupW = 44;
  const width = data.length * groupW + 20;

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={H + 28} className="block">
        {data.map((d, i) => {
          const x = 10 + i * groupW;
          const incH = (d.income / max) * H;
          const expH = (d.expense / max) * H;
          const op = d.projected ? 0.45 : 1;
          return (
            <g key={i}>
              <rect x={x} y={H - incH} width={barW} height={incH} rx="3"
                fill="#6366f1" opacity={op}
                strokeDasharray={d.projected ? '3 2' : '0'} stroke={d.projected ? '#818cf8' : 'none'} />
              <rect x={x + barW + 3} y={H - expH} width={barW} height={expH} rx="3"
                fill="#f43f5e" opacity={op}
                strokeDasharray={d.projected ? '3 2' : '0'} stroke={d.projected ? '#fb7185' : 'none'} />
              <text x={x + barW} y={H + 16} textAnchor="middle" className="fill-slate-500" fontSize="10">{d.label}</text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-500" /> {tt(lang, 'Income', 'الدخل')}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500" /> {tt(lang, 'Expense', 'المصروفات')}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-indigo-400 border-dashed" /> {tt(lang, 'Projected', 'متوقع')}</span>
      </div>
    </div>
  );
}

// Daily line/area chart (e.g. visits over time). data: [{ label, views }]
export function LineChart({ data, color = '#6366f1' }) {
  if (!data || data.length === 0) return null;
  const W = 640, H = 160, pad = 8;
  const max = Math.max(1, ...data.map(d => d.views));
  const stepX = (W - pad * 2) / Math.max(1, data.length - 1);
  const pts = data.map((d, i) => [pad + i * stepX, H - pad - (d.views / max) * (H - pad * 2)]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H - pad} L${pts[0][0].toFixed(1)},${H - pad} Z`;
  const showEvery = Math.ceil(data.length / 8);
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full" style={{ minWidth: 480 }}>
        <defs>
          <linearGradient id="lc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#lc)" />
        <path d={line} fill="none" stroke={color} strokeWidth="2" />
        {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2" fill={color} />)}
        {data.map((d, i) => i % showEvery === 0 && (
          <text key={i} x={pad + i * stepX} y={H + 12} textAnchor="middle" className="fill-slate-500" fontSize="9">{d.label}</text>
        ))}
      </svg>
    </div>
  );
}

export function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-700'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'start-5' : 'start-0.5'}`} />
    </button>
  );
}
