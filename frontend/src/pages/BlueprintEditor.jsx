import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, ExternalLink, ChevronUp, ChevronDown, Trash2, Plus, Check, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../i18n/LangContext.jsx';
import BlueprintPreview from '../blueprint/BlueprintPreview.jsx';
import FieldEditor from '../blueprint/FieldEditor.jsx';
import { BLOCK_DEFAULTS, BLOCK_TYPES, newBlockId } from '../blueprint/blockDefaults.js';
import { blockLabel } from '../blueprint/labels.js';
import { siteUrl } from '../utils/site.js';

export default function BlueprintEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const { lang } = useLang();
  const ar = lang === 'ar';

  const [project, setProject] = useState(null);
  const [bp, setBp] = useState(null);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [addType, setAddType] = useState('FeaturesGrid');

  useEffect(() => {
    let active = true;
    authFetch(`/api/projects/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Not found')))
      .then(p => { if (active) { setProject(p); setBp(p.blueprint || null); } })
      .catch(e => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  const update = next => { setBp(next); setSaved(false); };
  const updateTheme = (k, v) => update({ ...bp, theme: { ...bp.theme, [k]: v } });
  const updateBlockContent = (idx, content) => {
    const blocks = bp.blocks.slice();
    blocks[idx] = { ...blocks[idx], content };
    update({ ...bp, blocks });
  };
  const moveBlock = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= bp.blocks.length) return;
    const blocks = bp.blocks.slice();
    [blocks[idx], blocks[j]] = [blocks[j], blocks[idx]];
    update({ ...bp, blocks });
    setSelected(j);
  };
  const deleteBlock = idx => {
    const blocks = bp.blocks.filter((_, i) => i !== idx);
    update({ ...bp, blocks });
    setSelected(Math.max(0, idx - 1));
  };
  const addBlock = () => {
    const block = { id: newBlockId(addType), type: addType, content: structuredClone(BLOCK_DEFAULTS[addType]) };
    update({ ...bp, blocks: [...bp.blocks, block] });
    setSelected(bp.blocks.length);
  };

  const save = async () => {
    setSaving(true); setError('');
    try {
      const res = await authFetch(`/api/blueprint/${id}`, { method: 'PATCH', body: JSON.stringify({ blueprint: bp }) });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 422 && data.issues) {
          throw new Error((ar ? 'فشل التحقق: ' : 'Validation failed: ') + data.issues.map(i => `${i.path?.join('.')} ${i.message}`).slice(0, 3).join('; '));
        }
        throw new Error(data.error || 'Save failed');
      }
      setSaved(true);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <Center><Spinner /></Center>;
  if (error && !bp) return <Center><div className="text-slate-400">{error}</div></Center>;
  if (!bp) return (
    <Center>
      <div className="text-center max-w-md">
        <p className="text-slate-300">{ar ? 'هذا المشروع لا يحتوي على تصميم Blueprint.' : 'This project has no Blueprint.'}</p>
        <Link to={`/editor/${id}`} className="mt-4 inline-block text-indigo-400 hover:text-indigo-300">{ar ? 'فتح المحرر القديم' : 'Open legacy editor'} →</Link>
      </div>
    </Center>
  );

  const liveUrl = project?.published_slug ? siteUrl(project.published_slug) : null;
  const block = bp.blocks[selected];

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white"><ArrowLeft size={20} /></button>
          <input
            value={bp.project_name}
            onChange={e => update({ ...bp, project_name: e.target.value })}
            className="bg-transparent font-bold text-lg focus:outline-none focus:bg-slate-900 rounded px-2 py-1 min-w-0 truncate"
          />
        </div>
        <div className="flex items-center gap-2">
          {error && <span className="text-amber-400 text-xs flex items-center gap-1 max-w-xs truncate"><AlertTriangle size={14} />{error}</span>}
          {liveUrl && <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-300 hover:text-white flex items-center gap-1 px-3 py-2">{ar ? 'عرض' : 'View'} <ExternalLink size={14} /></a>}
          <button onClick={save} disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
            {saving ? <Spinner small /> : saved ? <Check size={16} /> : <Save size={16} />}
            {saved ? (ar ? 'تم الحفظ' : 'Saved') : (ar ? 'حفظ' : 'Save')}
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Controls */}
        <aside className="w-[380px] shrink-0 border-r border-slate-800 overflow-y-auto p-4 space-y-6">
          {/* Theme */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">{ar ? 'المظهر' : 'Theme'}</h3>
            <div className="grid grid-cols-2 gap-3">
              <ColorField label={ar ? 'أساسي' : 'Primary'} value={bp.theme.primary_color} onChange={v => updateTheme('primary_color', v)} />
              <ColorField label={ar ? 'ثانوي' : 'Secondary'} value={bp.theme.secondary_color} onChange={v => updateTheme('secondary_color', v)} />
              <div>
                <label className="block text-xs text-slate-400 mb-1">{ar ? 'الخط' : 'Font'}</label>
                <input value={bp.theme.font_family} onChange={e => updateTheme('font_family', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
              </div>
              <SelectField label={ar ? 'الزوايا' : 'Radius'} value={bp.theme.border_radius} options={['none', 'sm', 'md', 'lg', 'full']} onChange={v => updateTheme('border_radius', v)} />
              <SelectField label={ar ? 'الاتجاه' : 'Direction'} value={bp.direction} options={['rtl', 'ltr']} onChange={v => update({ ...bp, direction: v })} />
              <div>
                <label className="block text-xs text-slate-400 mb-1">{ar ? 'اللغة' : 'Lang'}</label>
                <input value={bp.language} onChange={e => update({ ...bp, language: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          </section>

          {/* Blocks list */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">{ar ? 'الأقسام' : 'Blocks'}</h3>
            <div className="space-y-1">
              {bp.blocks.map((b, i) => (
                <div key={b.id} className={`flex items-center gap-1 rounded-lg px-2 py-1.5 ${i === selected ? 'bg-indigo-600/20 border border-indigo-600/50' : 'hover:bg-slate-800'}`}>
                  <button onClick={() => setSelected(i)} className="flex-1 text-left text-sm truncate">{blockLabel(b.type, lang)}</button>
                  <button onClick={() => moveBlock(i, -1)} className="text-slate-500 hover:text-white p-0.5"><ChevronUp size={14} /></button>
                  <button onClick={() => moveBlock(i, 1)} className="text-slate-500 hover:text-white p-0.5"><ChevronDown size={14} /></button>
                  <button onClick={() => deleteBlock(i)} className="text-slate-500 hover:text-red-400 p-0.5"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <select value={addType} onChange={e => setAddType(e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm">
                {BLOCK_TYPES.map(bt => <option key={bt} value={bt}>{blockLabel(bt, lang)}</option>)}
              </select>
              <button onClick={addBlock} className="bg-slate-800 hover:bg-slate-700 px-3 rounded-lg flex items-center gap-1 text-sm"><Plus size={14} /></button>
            </div>
          </section>

          {/* Selected block content */}
          {block && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">{blockLabel(block.type, lang)}</h3>
              <FieldEditor value={block.content} fieldKey="content" lang={lang} onChange={content => updateBlockContent(selected, content)} />
            </section>
          )}
        </aside>

        {/* Preview */}
        <main className="flex-1 overflow-y-auto bg-white">
          <BlueprintPreview blueprint={bp} />
        </main>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-6 h-6 rounded cursor-pointer bg-transparent" />
        <input value={value} onChange={e => onChange(e.target.value)} className="flex-1 bg-transparent text-sm focus:outline-none w-0" />
      </div>
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Center({ children }) {
  return <div className="min-h-screen bg-slate-950 flex items-center justify-center">{children}</div>;
}
function Spinner({ small }) {
  return <div className={`${small ? 'w-4 h-4' : 'w-8 h-8'} border-2 border-white border-t-transparent rounded-full animate-spin`} />;
}
