import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const LONG_KEYS = new Set(['description', 'answer', 'bio', 'quote', 'subtitle']);
const inputCls = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none';
const labelCls = 'block text-xs font-medium text-slate-400 mb-1 capitalize';

function emptyLike(sample) {
  if (typeof sample === 'string') return '';
  if (Array.isArray(sample)) return [];
  if (sample && typeof sample === 'object') {
    return Object.fromEntries(Object.keys(sample).map(k => [k, emptyLike(sample[k])]));
  }
  return '';
}

// Recursively renders form controls for an arbitrary JSON value.
export default function FieldEditor({ value, onChange, fieldKey }) {
  // String
  if (typeof value === 'string') {
    const long = LONG_KEYS.has(fieldKey);
    return long ? (
      <textarea className={inputCls + ' min-h-[64px]'} value={value} onChange={e => onChange(e.target.value)} />
    ) : (
      <input className={inputCls} value={value} onChange={e => onChange(e.target.value)} />
    );
  }

  // Array
  if (Array.isArray(value)) {
    const sample = value[0] ?? '';
    return (
      <div className="space-y-2">
        {value.map((item, i) => (
          <div key={i} className="rounded-lg border border-slate-700/60 p-2 bg-slate-900/40">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <FieldEditor
                  value={item}
                  fieldKey={fieldKey}
                  onChange={next => {
                    const copy = value.slice();
                    copy[i] = next;
                    onChange(copy);
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="text-slate-500 hover:text-red-400 p-1"
                title="Remove"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...value, emptyLike(sample)])}
          className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
        >
          <Plus size={14} /> Add item
        </button>
      </div>
    );
  }

  // Object
  if (value && typeof value === 'object') {
    return (
      <div className="space-y-3">
        {Object.keys(value).map(k => (
          <div key={k}>
            <label className={labelCls}>{k.replace(/_/g, ' ')}</label>
            <FieldEditor
              value={value[k]}
              fieldKey={k}
              onChange={next => onChange({ ...value, [k]: next })}
            />
          </div>
        ))}
      </div>
    );
  }

  return null;
}
