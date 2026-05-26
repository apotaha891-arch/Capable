import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Sparkles, Send, Code2, Eye, Loader, Save, AlertCircle, CheckCircle, Clock, ChevronDown, ChevronUp, Zap, Settings, X, Plus, FileCode, FileType2, FileJson, Camera } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useLang } from '../i18n/LangContext.jsx';
import LangToggle from '../components/LangToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const NEW_PROJECT_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Project</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-white flex items-center justify-center h-screen">
  <div class="text-center">
    <h1 class="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-4">Start Building!</h1>
    <p class="text-slate-400 text-lg">Describe what you want to create in the AI Assistant panel.</p>
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
  const [editingName, setEditingName] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [tokenInfo, setTokenInfo] = useState(null); 
  const { t } = useLang();
  const { authFetch } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const nameRef = useRef(null);
  const iframeRef = useRef(null);

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
        return authFetch(`/api/projects/${id}/files`);
      })
      .then(r => r.ok ? r.json() : [])
      .then(f => {
        if (f.length === 0) {
          // Fallback to single code if no files exist
          const fallbackFile = { id: 'fallback', filename: 'index.html', content: loadedProject.code || NEW_PROJECT_CODE, file_type: 'html' };
          setFiles([fallbackFile]);
          setActiveFileId('fallback');
        } else {
          setFiles(f);
          setActiveFileId(f[0].id);
        }
      })
      .catch(() => navigate('/dashboard'));
  }, [id, navigate, t]);

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
      if (f.filename.endsWith('.css')) styleContent += `n${f.content}`;
      if (f.filename.endsWith('.js')) scriptContent += `n${f.content}`;
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

  const compiledSrcDoc = getCompiledCode() + 
    `<script>
      // Intercept all link clicks to handle internal routing
      document.addEventListener('click', function(e) {
        var a = e.target.closest('a');
        if (a) {
          var href = a.getAttribute('href');
          if (href && href.startsWith('#')) return; // allow anchor smooth scrolling
          e.preventDefault();
          if (href && !href.startsWith('http') && !href.startsWith('javascript:')) {
            window.parent.postMessage({ type: 'NAVIGATE', href: href }, '*');
          } else if (href) {
            alert('External navigation is disabled in preview mode.');
          }
        }
      });
      // Intercept form submissions
      document.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Form submission is disabled in preview mode.');
      });
    </script>`;

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
        body: JSON.stringify({ prompt, history, project_id: id }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        if (err.upgrade_required) {
          throw new Error(t('lang') === 'ar' ? `نفدت توكناتك الشهرية (${err.tokens_used}/${err.tokens_limit}). الرجاء الترقية.` : `Monthly token limit reached (${err.tokens_used}/${err.tokens_limit}). Please upgrade.`);
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
          body: JSON.stringify({ name: projectName, description, thumbnail_url: thumbnailUrl, price: Number(price), code: compiledCode }),
        });
        if (!res.ok) throw new Error('Update failed');
        
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
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* ── Navbar ── */}
      <nav className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 bg-slate-900 shrink-0">
        <Link to="/" className="flex items-center gap-1.5 mr-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg"><Sparkles size={16} /></div>
          <span className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Capable</span>
        </Link>

        {/* Editable project name */}
        {editingName ? (
          <input
            ref={nameRef}
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
            autoFocus
            className="bg-slate-800 border border-indigo-500 rounded px-2 py-1 text-sm text-white focus:outline-none w-48"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-slate-300 hover:text-white text-sm px-2 py-1 rounded hover:bg-slate-800 transition-colors truncate max-w-[180px]"
            title={t('clickToRename')}
          >{projectName || t('untitled')}</button>
        )}

        <button onClick={() => setShowSettings(true)} className="text-slate-400 hover:text-white transition-colors" title={t('settings')}>
          <Settings size={18} />
        </button>

        <div className="flex items-center gap-2 ml-auto">
          {tokenInfo && (
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-800 rounded-lg px-3 py-1.5 text-xs">
              <Zap size={12} className="text-indigo-400" />
              <span className="text-slate-300">{tokenInfo.tokens_used.toLocaleString()}</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-500">{tokenInfo.tokens_limit.toLocaleString()}</span>
            </div>
          )}
              <button
            onClick={() => { handleSave(); setTimeout(() => captureThumbnail(id), 500); }}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
          >
            {saving ? <Loader className="animate-spin" size={14} /> : <Save size={14} />}
            {saving ? t('saving') : t('save')}
          </button>
          <button onClick={() => captureThumbnail(id)} className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors" title="Capture Thumbnail">
            <Camera size={14} />
          </button>
          <LangToggle />
          <Link to="/dashboard" className="text-slate-400 hover:text-white text-sm">{t('myProjects')}</Link>
          <Link to="/explore"   className="text-slate-400 hover:text-white text-sm">{t('explore')}</Link>
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

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar (File Explorer + AI) ── */}
        <div className="w-72 shrink-0 border-r border-slate-800 bg-slate-900/50 flex flex-col overflow-hidden">
          
          {/* Files */}
          <div className="flex-1 flex flex-col min-h-0 border-b border-slate-800">
            <div className="flex items-center justify-between p-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('lang') === 'ar' ? 'الملفات' : 'Files'}</span>
              <button onClick={handleAddFile} className="text-slate-400 hover:text-white transition-colors">
                <Plus size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {files.map(f => (
                <div 
                  key={f.id} 
                  onClick={() => { setActiveFileId(f.id); setActiveTab('code'); }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${activeFileId === f.id ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  <div className="flex items-center gap-2">
                    {getFileIcon(f.filename)}
                    <span>{f.filename}</span>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteFile(f.id, e)}
                    className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* AI Assistant */}
          <div className="p-4 flex-1 flex flex-col min-h-0 overflow-y-auto">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-400" /> {t('aiAssistant')}
            </h2>

            <form onSubmit={handleGenerate} className="flex flex-col gap-2">
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('generatePlaceholder')}
                disabled={loading}
                rows={5}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none text-sm disabled:opacity-50"
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
            </form>

            {/* ── History ── */}
            {history.length > 0 && (
              <div className="mt-4 border-t border-slate-700 pt-3">
                <button
                  onClick={() => setShowHistory(h => !h)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 hover:text-slate-200"
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
                        className="w-full text-left p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors group"
                      >
                        <div className="text-xs text-slate-200 group-hover:text-white truncate">{item.prompt}</div>
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
        <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden relative">
          
          {/* Settings Modal */}
          {showSettings && (
            <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl flex flex-col">
                <div className="flex items-center justify-between p-5 border-b border-slate-800">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Settings size={20} className="text-indigo-400" /> {t('projectSettings')}
                  </h3>
                  <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">{t('description')}</label>
                    <textarea 
                      value={description} onChange={e => setDescription(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none min-h-[80px]"
                      placeholder="e.g. A beautiful landing page for a SaaS..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">{t('thumbnailUrl')}</label>
                    <input 
                      type="url" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                      placeholder="https://example.com/image.png"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">{t('price')}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input 
                        type="number" min="0" value={price} onChange={e => setPrice(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="p-5 border-t border-slate-800 flex justify-end gap-3">
                  <button onClick={() => setShowSettings(false)} className="px-4 py-2 text-slate-300 hover:text-white text-sm font-medium">
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
          <div className="flex bg-slate-900 border-b border-slate-800">
            {[['preview', <Eye size={14}/>, t('preview')], ['code', <Code2 size={14}/>, t('code')]].map(([tab, icon, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  activeTab === tab ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
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
              <div className="absolute inset-0 w-full h-full bg-slate-900 flex flex-col">
                <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                  {getFileIcon(activeFile.filename)}
                  {activeFile.filename}
                </div>
                <textarea
                  value={activeFile.content}
                  onChange={e => setFiles(files.map(f => f.id === activeFileId ? { ...f, content: e.target.value } : f))}
                  className="flex-1 w-full bg-slate-900 p-4 text-sm leading-relaxed text-slate-300 font-mono border-none focus:outline-none resize-none"
                  spellCheck={false}
                />
              </div>
            )}
            
            {activeTab === 'code' && !activeFile && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                {t('lang') === 'ar' ? 'حدد ملفاً لتعديله' : 'Select a file to edit'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
