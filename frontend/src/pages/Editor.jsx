import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Sparkles, Send, Code2, Eye, Loader, Save, AlertCircle, CheckCircle, Clock, ChevronDown, ChevronUp, Zap, Settings, X, Plus, FileCode, FileType2, FileJson, Camera, Globe, Copy, ShieldCheck, ShoppingBag, Users, ChevronRight, FolderOpen } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useLang } from '../i18n/LangContext.jsx';
import LangToggle from '../components/LangToggle.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Model tiers (same engine as the Builder). Higher tiers cost more but review harder.
const EDITOR_TIERS = [
  { id: 'capable1', name: 'Capable 1', ar: 'سريع واقتصادي', en: 'Fast & economical' },
  { id: 'capable2', name: 'Capable 2', ar: 'جودة أعلى ومراجعة أدق', en: 'Higher quality, deeper review' },
  { id: 'capable3', name: 'Capable 3', ar: 'أعلى جودة — استهلاك أكبر وحد أقل', en: 'Top quality — more usage, tighter limit' },
];
// Friendly status lines shown while the agent works.
const EDITOR_STATUS = [
  { ar: 'وكيل كيبابل يفكّر في الحل…', en: 'Capable is thinking…' },
  { ar: 'يكتب الكود ويبني الملفات…', en: 'Writing the code and files…' },
  { ar: 'يراجع الجودة ويصلح التفاصيل…', en: 'Reviewing quality and fixing details…' },
  { ar: 'يلمّع اللمسات الأخيرة…', en: 'Polishing the final touches…' },
];

function DnsRow({ label, host, value, onCopy }) {
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

// Placeholder shown in the preview for an empty project. Localized so an Arabic
// session doesn't see English copy (the original bug from the editor screenshot).
const newProjectCode = (isRTL) => `<!DOCTYPE html>
<html lang="${isRTL ? 'ar' : 'en'}" dir="${isRTL ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isRTL ? 'مشروع جديد' : 'New Project'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-white flex items-center justify-center h-screen" style="font-family: ${isRTL ? "'Cairo', sans-serif" : 'system-ui, sans-serif'}">
  <div class="text-center px-6">
    <h1 class="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-4">${isRTL ? 'لنبدأ البناء!' : 'Start Building!'}</h1>
    <p class="text-slate-400 text-lg">${isRTL ? 'صِف ما تريد إنشاءه في لوحة المساعد الذكي على اليسار.' : 'Describe what you want to create in the AI Assistant panel.'}</p>
  </div>
</body>
</html>`;

export default function Editor() {
  const [prompt, setPrompt] = useState('');
  
  // Multi-file state
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [activeHtmlFile, setActiveHtmlFile] = useState('index.html');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [price, setPrice] = useState(0);
  const [customDomain, setCustomDomain] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('general');
  const [domainInfo, setDomainInfo] = useState(null);
  const [domainBusy, setDomainBusy] = useState(false);
  const [domainMessage, setDomainMessage] = useState(null);
  
  const [tokenInfo, setTokenInfo] = useState(null);
  const [generationCount, setGenerationCount] = useState(0);
  const [showGrowthSignal, setShowGrowthSignal] = useState(false);
  const [growthDismissed, setGrowthDismissed] = useState(false);
  const [tier, setTier] = useState('capable1');     // capable1 | capable2 | capable3
  const [statusIdx, setStatusIdx] = useState(0);    // cycles the working status line
  const { t } = useLang();
  const isRTL = t('lang') === 'ar';
  const { authFetch, user } = useAuth();
  // Custom-domain gating (mirrors backend PLAN_LIMITS): free locked, Influence 1
  // (branded), Pro/enterprise unlimited (unbranded).
  const domainsAllowed = ({ influence: true, pro: true, enterprise: true }[user?.plan]) || false;
  const domainIsBranded = user?.plan === 'influence';
  const { id } = useParams();
  const navigate = useNavigate();
  const nameRef = useRef(null);
  const iframeRef = useRef(null);

  // Rotate the agent status line while generating.
  useEffect(() => {
    if (!loading) { setStatusIdx(0); return; }
    const iv = setInterval(() => setStatusIdx(i => i + 1), 4000);
    return () => clearInterval(iv);
  }, [loading]);

  /* ── load project ─────────────────────────────── */
  useEffect(() => {
    if (!id) { navigate('/dashboard'); return; }
    
    let loadedProject = null;
    authFetch(`/api/projects/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(p => { 
        loadedProject = p;
        setProjectName(p.name || t('untitled'));
        setDescription(p.description || '');
        setThumbnailUrl(p.thumbnail_url || '');
        setPrice(p.price || 0);
        setCustomDomain(p.custom_domain || '');
        return authFetch(`/api/projects/${id}/files`);
      })
      .then(r => r.ok ? r.json() : [])
      .then(f => {
        if (f.length === 0) {
          // Fallback to single code if no files exist
          const fallbackFile = { id: 'fallback', filename: 'index.html', content: loadedProject.code || newProjectCode(isRTL), file_type: 'html' };
          setFiles([fallbackFile]);
          setActiveFileId('fallback');
        } else {
          setFiles(f);
          setActiveFileId(f[0].id);
        }
      })
      .catch(() => navigate('/dashboard'));
  }, [id, navigate, t]);

  /* ── load domain instructions when the deployment tab opens with a domain ─ */
  useEffect(() => {
    if (showSettings && settingsTab === 'deployment' && customDomain && !domainInfo) {
      fetchDomainInfo();
    }
  }, [showSettings, settingsTab, customDomain]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── auto-clear notifications ─────────────────── */
  useEffect(() => { if (success) { const timer = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(timer); } }, [success]);
  useEffect(() => { if (!projectName) setProjectName(t('untitled')); }, [t]);
  useEffect(() => { if (error)   { const timer2 = setTimeout(() => setError(''),  6000); return () => clearTimeout(timer2); } }, [error]);

  /* ── handle iframe navigation ─────────────────── */
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data?.type === 'NAVIGATE') {
        let target = e.data.href;
        if (target.startsWith('/')) target = target.substring(1);
        if (!target.endsWith('.html')) target += '.html';
        
        // check if file exists
        const exists = files.some(f => f.filename === target);
        if (exists) {
          setActiveHtmlFile(target);
          setActiveTab('preview');
        } else {
          alert(`File ${target} not found in this project!`);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [files]);

  /* ── Compilation ─────────────────────────────── */
  const getCompiledCode = () => {
    let htmlFile = files.find(f => f.filename === activeHtmlFile);
    if (!htmlFile) htmlFile = files.find(f => f.filename.endsWith('.html'));
    let htmlContent = htmlFile ? htmlFile.content : '<!DOCTYPE html><html><body></body></html>';
    
    let styleContent = '';
    let scriptContent = '';
    
    files.forEach(f => {
      if (f.filename.endsWith('.css')) styleContent += `\n${f.content}`;
      if (f.filename.endsWith('.js')) scriptContent += `\n${f.content}`;
    });
    
    if (styleContent) {
      if (htmlContent.includes('</head>')) {
        htmlContent = htmlContent.replace('</head>', `<style>${styleContent}</style></head>`);
      } else {
        htmlContent += `<style>${styleContent}</style>`;
      }
    }
    
    if (scriptContent) {
      if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace('</body>', `<script>${scriptContent}</script></body>`);
      } else {
        htmlContent += `<script>${scriptContent}</script>`;
      }
    }
    
    return htmlContent;
  };

  const compiledSrcDoc = React.useMemo(() => getCompiledCode() +
    `<script>
      document.addEventListener('click', function(e) {
        var a = e.target.closest('a');
        if (!a) return;
        var href = a.getAttribute('href');
        e.preventDefault();
        if (!href) return;
        if (href.startsWith('#')) {
          if (href.length > 1) {
            var target = document.querySelector(href);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          return;
        }
        if (href.startsWith('http') || href.startsWith('javascript:')) {
          alert('External navigation is disabled in preview mode.');
          return;
        }
        window.parent.postMessage({ type: 'NAVIGATE', href: href }, '*');
      });
      document.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Form submission is disabled in preview mode.');
      });
    </script>`,
    [files, activeHtmlFile]
  );

  /* ── auto capture thumbnail ───────────────────── */
  const captureThumbnail = async (projectId) => {
    try {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentDocument) return;
      const canvas = await html2canvas(iframe.contentDocument.body, { useCORS: true, allowTaint: true });
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      
      const res = await authFetch('/api/projects/' + projectId + '/thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });
      if (res.ok) {
        const data = await res.json();
        setThumbnailUrl(data.url);
      }
    } catch (err) {
      console.error('Failed to capture thumbnail:', err);
    }
  };

  /* ── generate ────────────────────────────────── */
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError('');
    const startTime = Date.now();

    try {
      const response = await authFetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt, history, project_id: id, tier }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        if (err.error === 'tier_limit_reached') {
          if (err.can_downgrade) setTier('capable1');
          throw new Error(isRTL
            ? `انتهى حد موديل ${err.tier} (الأعلى جودة يستهلك أكثر). تم الرجوع للموديل الأقل — أو رقِّ باقتك للاستمرار عليه.`
            : `${err.tier} limit reached (higher quality costs more). Switched you to the cheaper model — or upgrade to keep using it.`);
        }
        if (err.upgrade_required) {
          throw new Error(isRTL ? `نفدت توكناتك الشهرية (${err.tokens_used}/${err.tokens_limit}). الرجاء الترقية.` : `Monthly token limit reached (${err.tokens_used}/${err.tokens_limit}). Please upgrade.`);
        }
        throw new Error(err.details || `Server error ${response.status}`);
      }
      const data = await response.json();
      if (!data.code) throw new Error('No code returned from server.');

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      
      // Update files with AI generated files
      let newFiles = [...files];
      if (data.files && data.files.length > 0) {
        data.files.forEach(aiFile => {
          const idx = newFiles.findIndex(f => f.filename === aiFile.filename);
          if (idx !== -1) {
            newFiles[idx] = { ...newFiles[idx], content: aiFile.content };
          } else {
            newFiles.push({ id: 'new_' + Date.now() + Math.random(), filename: aiFile.filename, content: aiFile.content, file_type: aiFile.filename.split('.').pop() });
          }
        });
        setActiveHtmlFile(data.files.find(f => f.filename.endsWith('.html'))?.filename || 'index.html');
      } else if (data.code) {
        // Fallback if AI didn't return JSON
        let mainFileIndex = newFiles.findIndex(f => f.filename === 'index.html');
        if (mainFileIndex === -1 && newFiles.length > 0) mainFileIndex = 0;
        if (mainFileIndex !== -1) {
          newFiles[mainFileIndex] = { ...newFiles[mainFileIndex], content: data.code };
        } else {
          newFiles.push({ id: 'new_' + Date.now(), filename: 'index.html', content: data.code, file_type: 'html' });
        }
      }
      
      setFiles(newFiles);
      setIframeKey(k => k + 1);
      setHistory(prev => [{ prompt, code: data.code, files: data.files, time: new Date().toLocaleTimeString(), elapsed }, ...prev]);
      if (data.tokens_used !== undefined) setTokenInfo({ tokens_used: data.tokens_used, tokens_limit: data.tokens_limit });
      setPrompt('');
      setActiveTab('preview');
      setSuccess(`✓ ${t('generatedIn')} ${elapsed}s`);

      const newCount = generationCount + 1;
      setGenerationCount(newCount);
      if (newCount >= 5 && !growthDismissed) setShowGrowthSignal(true);
      
      // Auto-capture thumbnail after a delay to allow rendering
      if (id) {
        setTimeout(() => captureThumbnail(id), 2000);
      }
    } catch (err) {
      setError(err.message || t('failedGenerate'));
    } finally {
      setLoading(false);
    }
  };

  /* ── save ────────────────────────────────────── */
  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (id) {
        const compiledCode = getCompiledCode();
        
        // 1. Update project metadata
        const res = await authFetch(`/api/projects/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: projectName, description, thumbnail_url: thumbnailUrl, price: Number(price), code: compiledCode, custom_domain: customDomain || null }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          if (d.error === 'upgrade_required') throw new Error(t('lang') === 'ar' ? 'النطاقات المخصصة متاحة في الباقات المدفوعة.' : 'Custom domains are available on paid plans.');
          if (d.error === 'domain_limit_reached') throw new Error(t('lang') === 'ar' ? `وصلت للحد الأقصى للنطاقات (${d.domains_limit}). رقِّ إلى Pro للمزيد.` : `Domain limit reached (${d.domains_limit}). Upgrade to Pro for more.`);
          throw new Error('Update failed');
        }
        
        // 2. Save individual files
        for (const f of files) {
          if (String(f.id).startsWith('fallback') || String(f.id).startsWith('new_')) {
            await authFetch(`/api/projects/${id}/files`, {
               method: 'POST', 
               body: JSON.stringify({ filename: f.filename, content: f.content, file_type: f.filename.split('.').pop() })
            });
          } else {
            await authFetch(`/api/projects/${id}/files/${f.id}`, {
               method: 'PUT', 
               body: JSON.stringify({ filename: f.filename, content: f.content })
            });
          }
        }
        
        // Reload files to get real DB IDs
        const fRes = await authFetch(`/api/projects/${id}/files`);
        if (fRes.ok) {
           const newFiles = await fRes.json();
           if(newFiles.length > 0) {
             setFiles(newFiles);
             if (String(activeFileId).startsWith('fallback') || String(activeFileId).startsWith('new_')) {
               setActiveFileId(newFiles.find(f => f.filename === files.find(old => old.id === activeFileId)?.filename)?.id || newFiles[0].id);
             }
           }
        }
        setSuccess(t('projectSaved'));
      }
    } catch (err) {
      setError(`${t('failedSave')}: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  /* ── domain verification ─────────────────────────── */
  const fetchDomainInfo = async () => {
    if (!id || !customDomain) { setDomainInfo(null); return; }
    setDomainBusy(true); setDomainMessage(null);
    try {
      const res = await authFetch(`/api/projects/${id}/domain/instructions`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setDomainInfo(data);
    } catch (err) {
      setDomainMessage({ type: 'error', text: err.message });
    } finally {
      setDomainBusy(false);
    }
  };

  const handleCheckDomain = async () => {
    setDomainBusy(true); setDomainMessage(null);
    try {
      const res = await authFetch(`/api/projects/${id}/domain/check`, { method: 'POST' });
      const data = await res.json();
      if (data.verified) {
        setDomainMessage({ type: 'success', text: t('lang') === 'ar' ? '✓ تم التحقق من الدومين بنجاح' : '✓ Domain verified successfully' });
        setDomainInfo(prev => prev ? { ...prev, verified: true } : prev);
      } else {
        setDomainMessage({ type: 'error', text: data.error || (t('lang') === 'ar' ? 'لم نجد سجل TXT المطابق' : 'Matching TXT record not found') });
      }
    } catch (err) {
      setDomainMessage({ type: 'error', text: err.message });
    } finally {
      setDomainBusy(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (!window.confirm(t('lang') === 'ar' ? 'إزالة الدومين المخصص؟' : 'Remove custom domain?')) return;
    try {
      await authFetch(`/api/projects/${id}/domain`, { method: 'DELETE' });
      setCustomDomain('');
      setDomainInfo(null);
      setDomainMessage(null);
    } catch (err) {
      setDomainMessage({ type: 'error', text: err.message });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
    setDomainMessage({ type: 'success', text: t('lang') === 'ar' ? 'تم النسخ' : 'Copied' });
    setTimeout(() => setDomainMessage(null), 1500);
  };

  const handleAddFile = () => {
    const name = window.prompt(t('lang') === 'ar' ? 'اسم الملف الجديد (مثال: style.css):' : 'New file name (e.g., style.css):');
    if (!name) return;
    const newId = 'new_' + Date.now();
    setFiles([...files, { id: newId, filename: name, content: '', file_type: name.split('.').pop() }]);
    setActiveFileId(newId);
    setActiveTab('code');
  };

  const handleDeleteFile = async (fileId, e) => {
    e.stopPropagation();
    if (!window.confirm(t('lang') === 'ar' ? 'هل أنت متأكد من حذف هذا الملف؟' : 'Are you sure you want to delete this file?')) return;
    
    if (!String(fileId).startsWith('new_') && !String(fileId).startsWith('fallback')) {
      try {
        await authFetch(`/api/projects/${id}/files/${fileId}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to delete file', err);
      }
    }
    
    const newFiles = files.filter(f => f.id !== fileId);
    setFiles(newFiles);
    if (activeFileId === fileId) {
      setActiveFileId(newFiles.length > 0 ? newFiles[0].id : null);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleGenerate(e);
  };

  const [activeTab, setActiveTab] = useState('preview');
  const activeFile = files.find(f => f.id === activeFileId);

  const getFileIcon = (filename) => {
    if (filename.endsWith('.html')) return <Code2 size={14} className="text-orange-400" />;
    if (filename.endsWith('.css')) return <FileType2 size={14} className="text-blue-400" />;
    if (filename.endsWith('.js')) return <FileJson size={14} className="text-yellow-400" />;
    return <FileCode size={14} className="text-slate-400" />;
  };

  return (
    <div className="h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col overflow-hidden">
      {/* ── Navbar ── */}
      <nav className="flex items-center gap-2 px-3 sm:px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur shrink-0 shadow-sm dark:shadow-none z-20">
        <Logo to="/" size="sm" wordClassName="hidden sm:block" />

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        {/* Editable project name */}
        {editingName ? (
          <input
            ref={nameRef}
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
            autoFocus
            className="bg-white dark:bg-slate-800 border border-indigo-500 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-48"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-sm font-medium px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors truncate max-w-[160px] sm:max-w-[220px]"
            title={t('clickToRename')}
          >{projectName || t('untitled')}</button>
        )}

        <button onClick={() => setShowSettings(true)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0" title={t('settings')}>
          <Settings size={16} />
        </button>

        <div className="flex items-center gap-2 ms-auto">
          {tokenInfo && (() => {
            const pct = Math.round((tokenInfo.tokens_used / tokenInfo.tokens_limit) * 100);
            const barColor = pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-indigo-500';
            const textColor = pct >= 90 ? 'text-red-500 dark:text-red-400' : pct >= 75 ? 'text-amber-500 dark:text-amber-400' : 'text-indigo-500 dark:text-indigo-400';
            return (
              <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5 text-xs">
                <Zap size={12} className={textColor} />
                <span className="text-slate-500 dark:text-slate-400">{t('aiCredits')}</span>
                <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(100 - pct, 100)}%` }} />
                </div>
              </div>
            );
          })()}
          <button
            onClick={() => { handleSave(); setTimeout(() => captureThumbnail(id), 500); }}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white px-3.5 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            {saving ? <Loader className="animate-spin" size={14} /> : <Save size={14} />}
            <span className="hidden sm:inline">{saving ? t('saving') : t('save')}</span>
          </button>
          <button onClick={() => captureThumbnail(id)} className="border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors" title={isRTL ? 'التقاط صورة مصغّرة' : 'Capture thumbnail'}>
            <Camera size={14} />
          </button>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

          <ThemeToggle />
          <LangToggle />
          <Link to="/dashboard" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm hidden lg:inline px-1">{t('myProjects')}</Link>
        </div>
      </nav>

      {/* ── Notifications ── */}
      {error && (
        <div className="flex items-center gap-2 bg-red-900/50 border-b border-red-700 px-4 py-2 text-red-300 text-sm shrink-0">
          <AlertCircle size={14} />{error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-white">✕</button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-emerald-900/50 border-b border-emerald-700 px-4 py-2 text-emerald-300 text-sm shrink-0">
          <CheckCircle size={14} />{success}
        </div>
      )}

      {/* Growth Signal — consulting upsell */}
      {showGrowthSignal && (
        <div className="flex items-center gap-3 bg-indigo-900/60 border-b border-indigo-700/60 px-4 py-2.5 shrink-0">
          <Users size={15} className="text-indigo-300 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-white">{t('growthSignalTitle')}</span>
            <span className="text-xs text-indigo-300 ml-2">{t('growthSignalDesc')}</span>
          </div>
          <a
            href="mailto:hello@capable.app?subject=Expert%20Help%20Request"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 whitespace-nowrap transition-colors"
          >
            {t('growthSignalCta')} <ChevronRight size={12} />
          </a>
          <button
            onClick={() => { setShowGrowthSignal(false); setGrowthDismissed(true); }}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden gap-3 p-3 bg-slate-200 dark:bg-black">
        {/* ── Sidebar (AI Assistant) ── */}
        <div className="w-72 shrink-0 rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-md flex flex-col overflow-hidden">

          {/* AI Assistant */}
          <div className="p-4 flex-1 flex flex-col min-h-0 overflow-y-auto">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-500 dark:text-indigo-400" /> {t('aiAssistant')}
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-500 mb-3">{t('aiCreditsDesc')}</p>

            <form onSubmit={handleGenerate} className="flex flex-col gap-2">
              {/* Model tier selector — all tiers available; higher ones cost more. */}
              <div className="flex items-center gap-1">
                {EDITOR_TIERS.map(tm => (
                  <button
                    key={tm.id}
                    type="button"
                    onClick={() => setTier(tm.id)}
                    title={isRTL ? tm.ar : tm.en}
                    disabled={loading}
                    className={`flex-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all disabled:opacity-50
                      ${tier === tm.id
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-indigo-500/40'}`}
                  >
                    {tm.name}
                  </button>
                ))}
              </div>
              <p className={`text-[10px] leading-relaxed ${tier === 'capable3' ? 'text-amber-400' : 'text-slate-500'}`}>
                {tier === 'capable3' && '⚡ '}
                {isRTL ? EDITOR_TIERS.find(x => x.id === tier).ar : EDITOR_TIERS.find(x => x.id === tier).en}
              </p>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('generatePlaceholder')}
                disabled={loading}
                rows={5}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none text-sm disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all text-sm"
              >
                {loading
                  ? <><Loader className="animate-spin" size={15} /> {t('generating')}</>
                  : <><Send size={15} /> {t('generate')}</>}
              </button>
              {loading && (
                <div className="flex items-center gap-2 text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2 animate-in fade-in">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                  <span key={statusIdx} className="animate-in fade-in">
                    {isRTL ? EDITOR_STATUS[statusIdx % EDITOR_STATUS.length].ar : EDITOR_STATUS[statusIdx % EDITOR_STATUS.length].en}
                  </span>
                </div>
              )}
            </form>

            {/* ── History ── */}
            {history.length > 0 && (
              <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-3">
                <button
                  onClick={() => setShowHistory(h => !h)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  <span className="flex items-center gap-1"><Clock size={12} /> {t('history')} ({history.length})</span>
                  {showHistory ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {showHistory && (
                  <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                    {history.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => { 
                          let newFiles = [...files];
                          if (item.files && item.files.length > 0) {
                            item.files.forEach(aiFile => {
                              const fIdx = newFiles.findIndex(f => f.filename === aiFile.filename);
                              if (fIdx !== -1) newFiles[fIdx] = { ...newFiles[fIdx], content: aiFile.content };
                              else newFiles.push({ id: 'new_' + Date.now() + Math.random(), filename: aiFile.filename, content: aiFile.content, file_type: aiFile.filename.split('.').pop() });
                            });
                          } else if (item.code) {
                            let mainFileIndex = newFiles.findIndex(f => f.filename === 'index.html');
                            if (mainFileIndex === -1 && newFiles.length > 0) mainFileIndex = 0;
                            if (mainFileIndex !== -1) newFiles[mainFileIndex] = { ...newFiles[mainFileIndex], content: item.code };
                          }
                          setFiles(newFiles);
                          setIframeKey(k => k + 1); 
                          setActiveTab('preview'); 
                        }}
                        className="w-full text-left p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-transparent hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors group"
                      >
                        <div className="text-xs text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white truncate">{item.prompt}</div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>{item.time}</span>
                          {item.elapsed && <span className="text-emerald-500">⚡ {item.elapsed}s</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Preview / Code Area ── */}
        <div className="flex-1 flex flex-col rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-md overflow-hidden relative">
          
          {/* Settings Modal */}
          {showSettings && (
            <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Settings size={20} className="text-indigo-500 dark:text-indigo-400" /> {t('projectSettings')}
                  </h3>
                  <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 shrink-0">
                  {[
                    ['general', t('lang') === 'ar' ? 'عام' : 'General'],
                    ['deployment', t('lang') === 'ar' ? 'النشر والدومين' : 'Deployment'],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setSettingsTab(key)}
                      className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${settingsTab === key ? 'border-indigo-500 text-indigo-600 dark:text-white' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                    >{label}</button>
                  ))}
                </div>

                <div className="p-5 space-y-4 overflow-y-auto flex-1">
                  {settingsTab === 'general' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('description')}</label>
                        <textarea
                          value={description} onChange={e => setDescription(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none min-h-[80px]"
                          placeholder="e.g. A beautiful landing page for a SaaS..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('thumbnailUrl')}</label>
                        <input
                          type="url" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
                          placeholder="https://example.com/image.png"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('price')}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                          <input
                            type="number" min="0" value={price} onChange={e => setPrice(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {settingsTab === 'deployment' && (
                    <div className="space-y-5">
                      {/* Custom domain block */}
                      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Globe size={15} className="text-emerald-400" />
                            {t('lang') === 'ar' ? 'النطاق المخصص' : 'Custom Domain'}
                          </h4>
                          {domainInfo?.verified && (
                            <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <ShieldCheck size={11} /> {t('lang') === 'ar' ? 'مُتحقق' : 'Verified'}
                            </span>
                          )}
                          {customDomain && domainInfo && !domainInfo.verified && (
                            <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                              {t('lang') === 'ar' ? 'بانتظار التحقق' : 'Pending'}
                            </span>
                          )}
                        </div>

                        {!domainsAllowed ? (
                          <div className="rounded-xl border border-indigo-700/40 bg-indigo-900/20 p-4 text-center">
                            <p className="text-sm text-slate-300 mb-3">
                              {t('lang') === 'ar' ? 'النطاقات المخصصة متاحة في الباقات المدفوعة. باقة Influence تشمل نطاقاً واحداً.' : 'Custom domains are a paid feature. The Influence plan includes one.'}
                            </p>
                            <Link to="/influence" className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                              <Zap size={14} /> {t('lang') === 'ar' ? 'الترقية' : 'Upgrade'}
                            </Link>
                          </div>
                        ) : (
                        <>
                        {domainIsBranded && (
                          <div className="mb-3 text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                            {t('lang') === 'ar' ? 'سيظهر شعار "Powered by Capable" على موقعك. رقِّ إلى Pro لإزالته.' : 'Your site will show a “Powered by Capable” badge. Upgrade to Pro to remove it.'}
                          </div>
                        )}

                        <div className="flex gap-2 mb-3">
                          <input
                            type="text" value={customDomain} onChange={e => setCustomDomain(e.target.value.trim().toLowerCase())}
                            placeholder="app.example.com"
                            className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
                          />
                          <button
                            onClick={async () => { await handleSave(); await fetchDomainInfo(); }}
                            disabled={!customDomain || saving}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
                          >
                            {customDomain && domainInfo ? (t('lang') === 'ar' ? 'تحديث' : 'Update') : (t('lang') === 'ar' ? 'حفظ' : 'Save')}
                          </button>
                          {customDomain && domainInfo && (
                            <button onClick={handleRemoveDomain} className="border border-slate-700 hover:border-red-500 hover:text-red-400 text-slate-400 rounded-xl px-3 text-sm">
                              <X size={14} />
                            </button>
                          )}
                        </div>

                        {!customDomain && (
                          <p className="text-xs text-slate-500">
                            {t('lang') === 'ar' ? 'أدخل نطاقك أعلاه وسنُعطيك إعدادات DNS اللازمة.' : 'Enter your domain above and we will give you the DNS records to set.'}
                          </p>
                        )}

                        {/* DNS instructions */}
                        {customDomain && domainInfo && (
                          <div className="space-y-3 mt-3">
                            <p className="text-xs text-slate-400">
                              {t('lang') === 'ar' ? 'أضف هذين السجلّين في لوحة إدارة DNS الخاصة بنطاقك، ثم اضغط "تحقق".' : 'Add these two records in your DNS control panel, then click Verify.'}
                            </p>

                            <DnsRow label="TXT" host={domainInfo.verification.host} value={domainInfo.verification.value} onCopy={copyToClipboard} />
                            <DnsRow label="CNAME" host={domainInfo.pointing.host} value={domainInfo.pointing.value} onCopy={copyToClipboard} />

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={handleCheckDomain}
                                disabled={domainBusy}
                                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5"
                              >
                                {domainBusy ? <Loader className="animate-spin" size={13} /> : <ShieldCheck size={13} />}
                                {domainInfo.verified
                                  ? (t('lang') === 'ar' ? 'إعادة التحقق' : 'Re-check')
                                  : (t('lang') === 'ar' ? 'تحقق من الدومين' : 'Verify domain')}
                              </button>
                              {domainInfo.verified && (
                                <a href={`http://${customDomain}`} target="_blank" rel="noreferrer" className="text-emerald-400 text-sm hover:underline flex items-center gap-1">
                                  http://{customDomain}
                                </a>
                              )}
                            </div>

                            {domainMessage && (
                              <div className={`text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 ${domainMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                {domainMessage.type === 'success' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                                {domainMessage.text}
                              </div>
                            )}
                          </div>
                        )}
                        </>
                        )}
                      </div>

                      {/* Buy a domain placeholder */}
                      <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-700/30 rounded-2xl p-4">
                        <div className="flex items-start justify-between mb-3 gap-3">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <ShoppingBag size={15} className="text-indigo-300" />
                              {t('lang') === 'ar' ? 'ليس لديك دومين؟' : "Don't have a domain?"}
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">
                              {t('lang') === 'ar' ? 'اشترِ دومين عبر Capable واحصل على ربط فوري وSSL مجاني.' : 'Buy a domain through Capable with instant setup and free SSL.'}
                            </p>
                          </div>
                          <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap">PRO</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                          {[['.com', 12], ['.app', 18], ['.io', 39], ['.dev', 14]].map(([tld, price]) => (
                            <div key={tld} className="bg-slate-900/60 rounded-lg px-3 py-2 flex justify-between items-center">
                              <span className="text-slate-300 font-mono">{tld}</span>
                              <span className="text-slate-500">${price}/yr</span>
                            </div>
                          ))}
                        </div>
                        <button disabled className="w-full bg-slate-800/60 text-slate-500 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
                          {t('lang') === 'ar' ? 'قريباً' : 'Coming soon'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 shrink-0">
                  <button onClick={() => setShowSettings(false)} className="px-4 py-2 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium">
                    {t('close')}
                  </button>
                  <button onClick={() => { handleSave(); setShowSettings(false); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20">
                    {t('saveSettings')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            {[['preview', <Eye size={14}/>, t('preview')], ['code', <Code2 size={14}/>, t('code')], ['files', <FolderOpen size={14}/>, t('lang') === 'ar' ? 'الملفات' : 'Files']].map(([tab, icon, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  activeTab === tab ? 'border-indigo-500 text-indigo-600 dark:text-white bg-white dark:bg-transparent' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {icon}{label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 relative overflow-hidden">
            {loading && (
              <div className="absolute inset-0 bg-slate-950/80 z-10 flex items-center justify-center">
                <div className="text-center">
                  <Loader className="animate-spin text-indigo-400 mx-auto mb-3" size={36} />
                  <p className="text-slate-300 text-sm font-medium">{t('generatingApp')}</p>
                  <p className="text-slate-500 text-xs mt-1">{t('thisMayTake')}</p>
                </div>
              </div>
            )}

            {/* Always-mounted iframe */}
            <iframe
              ref={iframeRef}
              key={iframeKey}
              title="Preview"
              srcDoc={compiledSrcDoc}
              className="w-full h-full border-0 bg-white"
              style={{ display: activeTab === 'preview' ? 'block' : 'none' }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
            />

            {activeTab === 'code' && activeFile && (
              <div className="absolute inset-0 w-full h-full bg-slate-50 dark:bg-slate-900 flex flex-col">
                <div className="bg-white dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  {getFileIcon(activeFile.filename)}
                  {activeFile.filename}
                </div>
                <textarea
                  value={activeFile.content}
                  onChange={e => setFiles(files.map(f => f.id === activeFileId ? { ...f, content: e.target.value } : f))}
                  className="flex-1 w-full bg-slate-50 dark:bg-slate-900 p-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-mono border-none focus:outline-none resize-none"
                  spellCheck={false}
                  dir="ltr"
                />
              </div>
            )}
            
            {activeTab === 'code' && !activeFile && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                {t('lang') === 'ar' ? 'حدد ملفاً لتعديله' : 'Select a file to edit'}
              </div>
            )}

            {activeTab === 'files' && (
              <div className="absolute inset-0 w-full h-full bg-slate-50 dark:bg-slate-900 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <FolderOpen size={16} className="text-indigo-500 dark:text-indigo-400" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{t('lang') === 'ar' ? 'ملفات المشروع' : 'Project Files'}</span>
                    <span className="text-xs text-slate-500">({files.length})</span>
                  </div>
                  <button
                    onClick={handleAddFile}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Plus size={14} /> {t('lang') === 'ar' ? 'ملف جديد' : 'New file'}
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {files.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                      {t('lang') === 'ar' ? 'لا توجد ملفات بعد' : 'No files yet'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {files.map(f => (
                        <div
                          key={f.id}
                          onClick={() => { setActiveFileId(f.id); setActiveTab('code'); }}
                          className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer border transition-colors ${activeFileId === f.id ? 'bg-indigo-50 dark:bg-indigo-600/15 border-indigo-300 dark:border-indigo-500/50' : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                        >
                          <div className="shrink-0">{getFileIcon(f.filename)}</div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm text-slate-700 dark:text-slate-200 truncate">{f.filename}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{(f.filename.split('.').pop() || '').toUpperCase()}</div>
                          </div>
                          <button
                            onClick={(e) => handleDeleteFile(f.id, e)}
                            className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            title={t('lang') === 'ar' ? 'حذف' : 'Delete'}
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
