import React, { useEffect, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, ExternalLink, ChevronUp, ChevronDown, Trash2, Plus, Check, AlertTriangle, Code2, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../i18n/LangContext.jsx';
import BlueprintPreview from '../blueprint/BlueprintPreview.jsx';
import FieldEditor from '../blueprint/FieldEditor.jsx';
import { BLOCK_DEFAULTS, BLOCK_TYPES, newBlockId } from '../blueprint/blockDefaults.js';
import { blockLabel } from '../blueprint/labels.js';

// Plans that may open a blueprint project in the code editor (المحرر).
const CODE_EDITOR_PLANS = ['influence', 'pro', 'enterprise'];

// Arabic-friendly font choices + UI languages offered in the theme panel.
const FONT_OPTIONS = ['Cairo', 'Tajawal', 'Almarai', 'Noto Kufi Arabic', 'IBM Plex Sans Arabic', 'Inter', 'Poppins', 'Roboto'];
const LANG_OPTIONS = ['ar', 'en'];

// Serialize a blueprint to a standalone, editable HTML document (Tailwind CDN +
// font + theme), reusing the same preview component the editor renders with.
function toStandaloneHtml(bp) {
  const inner = renderToStaticMarkup(<BlueprintPreview blueprint={bp} />);
  const font = bp?.theme?.font_family;
  const fontLink = font
    ? `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;600;700;900&display=swap" rel="stylesheet">`
    : '';
  return `<!DOCTYPE html>
<html lang="${bp.language || 'en'}" dir="${bp.direction || 'ltr'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${bp.project_name || 'Site'}</title>
<script src="https://cdn.tailwindcss.com"></script>
${fontLink}
</head>
<body>${inner}</body>
</html>`;
}

export default function BlueprintEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch, user } = useAuth();
  const { lang } = useLang();
  const ar = lang === 'ar';
  const canUseCodeEditor = CODE_EDITOR_PLANS.includes(user?.plan);
  const [converting, setConverting] = useState(false);

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

  // Paid: snapshot the blueprint as editable HTML and jump to the code editor.
  const openInCodeEditor = async () => {
    if (!canUseCodeEditor) { navigate('/influence'); return; }
    setConverting(true); setError('');
    try {
      const html = toStandaloneHtml(bp);
      const res = await authFetch(`/api/projects/${id}/convert-to-code`, { method: 'POST', body: JSON.stringify({ code: html }) });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'upgrade_required') { navigate('/influence'); return; }
        throw new Error(data.error || 'Failed to open code editor');
      }
      navigate(`/editor/${id}`);
    } catch (e) { setError(e.message); setConverting(false); }
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

  // Open a self-contained preview of the CURRENT blueprint in a new tab. Renders
  // client-side (no external renderer / VITE_RENDERER_URL dependency), so it works
  // regardless of deploy config and reflects unsaved edits.
  const openPreview = () => {
    const html = toStandaloneHtml(bp);
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };
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
          <button onClick={openPreview} title={ar ? 'معاينة في تبويب جديد' : 'Preview in a new tab'} className="text-sm text-slate-300 hover:text-white flex items-center gap-1 px-3 py-2">{ar ? 'عرض' : 'View'} <ExternalLink size={14} /></button>
          <button
            onClick={openInCodeEditor}
            disabled={converting}
            title={canUseCodeEditor ? (ar ? 'افتح في محرر الأكواد' : 'Open in code editor') : (ar ? 'ميزة مدفوعة — افتح في محرر الأكواد' : 'Paid feature — open in code editor')}
            className="text-sm border border-slate-700 hover:border-indigo-500 hover:text-indigo-300 text-slate-300 px-3 py-2 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
          >
            {converting ? <Spinner small /> : <Code2 size={14} />}
            {ar ? 'المحرر' : 'Code editor'}
            {!canUseCodeEditor && <Lock size={12} className="text-amber-400" />}
          </button>
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
              <SelectField label={ar ? 'الخط' : 'Font'} value={bp.theme.font_family} options={[...new Set([bp.theme.font_family, ...FONT_OPTIONS].filter(Boolean))]} onChange={v => updateTheme('font_family', v)} />
              <SelectField label={ar ? 'الزوايا' : 'Radius'} value={bp.theme.border_radius} options={['none', 'sm', 'md', 'lg', 'full']} onChange={v => updateTheme('border_radius', v)} />
              <SelectField label={ar ? 'الاتجاه' : 'Direction'} value={bp.direction} options={['rtl', 'ltr']} onChange={v => update({ ...bp, direction: v })} />
              <SelectField label={ar ? 'اللغة' : 'Lang'} value={bp.language} options={[...new Set([bp.language, ...LANG_OPTIONS].filter(Boolean))]} onChange={v => update({ ...bp, language: v })} />
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
