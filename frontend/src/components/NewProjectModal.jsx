import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Globe, Lock, DollarSign, Wand2, ExternalLink, AlertTriangle } from 'lucide-react';
import { useLang } from '../i18n/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function NewProjectModal({ isOpen, onClose }) {
  const { t, lang } = useLang();
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('ai'); // 'ai' | 'blank'
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { url, project_id }

  if (!isOpen) return null;

  const closeAndReset = () => {
    setResult(null); setError(''); setPrompt(''); setName(''); setDescription('');
    onClose();
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/auth'); return; }
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/blueprint/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt: prompt.trim().slice(0, 500), language: lang }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) throw new Error(lang === 'ar' ? 'تم بلوغ حد الاستخدام. قم بالترقية للمتابعة.' : 'Usage limit reached. Upgrade to continue.');
        if (res.status === 422) throw new Error(lang === 'ar' ? 'تعذّر توليد تصميم صالح. حاول بوصف أوضح.' : 'Could not generate a valid design. Try a clearer prompt.');
        throw new Error(data.error || 'Generation failed');
      }
      setResult({ url: data.url, project_id: data.project_id });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: name || t('untitled'),
          description,
          is_public: isPublic,
          price: isPublic ? Number(price) : 0,
          code: ''
        }),
      });

      if (!res.ok) throw new Error('Failed to create project');

      const newProject = await res.json();
      onClose();
      navigate(`/editor/${newProject.id}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col transform transition-all">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-indigo-400" size={24} /> 
            {lang === 'ar' ? 'إنشاء مشروع جديد' : 'Create New Project'}
          </h3>
          <button onClick={closeAndReset} className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-2 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Mode switch */}
        {!result && (
          <div className="px-6 pt-5">
            <div className="flex gap-2 p-1 bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => { setMode('ai'); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'ai' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Wand2 size={16} /> {lang === 'ar' ? 'توليد بالذكاء الاصطناعي' : 'Generate with AI'}
              </button>
              <button
                type="button"
                onClick={() => { setMode('blank'); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'blank' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {lang === 'ar' ? 'مشروع فارغ' : 'Blank project'}
              </button>
            </div>
          </div>
        )}

        {/* Success state */}
        {result && (
          <div className="p-6 space-y-5">
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Sparkles className="text-emerald-400" size={28} />
              </div>
              <h4 className="mt-4 text-lg font-bold text-white">
                {lang === 'ar' ? 'موقعك جاهز!' : 'Your site is live!'}
              </h4>
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-sm break-all"
              >
                {result.url} <ExternalLink size={14} />
              </a>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeAndReset}
                className="px-6 py-3 text-slate-300 hover:text-white text-sm font-bold"
              >
                {lang === 'ar' ? 'تم' : 'Done'}
              </button>
              <button
                type="button"
                onClick={() => { const id = result.project_id; closeAndReset(); navigate(`/blueprint/${id}`); }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-sm font-bold"
              >
                {lang === 'ar' ? 'فتح المحرر' : 'Open editor'}
              </button>
            </div>
          </div>
        )}

        {/* AI generate form */}
        {!result && mode === 'ai' && (
          <form onSubmit={handleGenerate} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {lang === 'ar' ? 'صِف الموقع الذي تريده' : 'Describe the site you want'}
              </label>
              <textarea
                required
                value={prompt}
                maxLength={500}
                onChange={e => setPrompt(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all min-h-[120px]"
                placeholder={lang === 'ar'
                  ? 'مثال: موقع لخدمة غسيل سيارات متنقلة في الرياض، مع قسم أسعار ونموذج تواصل عبر واتساب'
                  : 'e.g. A landing page for a mobile car-wash service in Riyadh, with pricing and a WhatsApp contact form'}
              />
              <div className="mt-1 text-xs text-slate-500 text-right">{prompt.length}/500</div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" /> <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={closeAndReset} className="px-6 py-3 text-slate-300 hover:text-white text-sm font-bold">
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> {lang === 'ar' ? 'جارٍ التوليد...' : 'Generating...'}</>
                ) : (
                  <><Wand2 size={16} /> {lang === 'ar' ? 'توليد الموقع' : 'Generate site'}</>
                )}
              </button>
            </div>
          </form>
        )}

        {!result && mode === 'blank' && (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {lang === 'ar' ? 'اسم المشروع' : 'Project Name'}
            </label>
            <input 
              type="text" 
              required
              value={name} 
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
              placeholder={lang === 'ar' ? 'مثال: متجر الكتروني، منصة تعليمية...' : 'e.g., E-commerce store, Learning platform...'}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('description')} <span className="text-slate-500 text-xs font-normal">({lang === 'ar' ? 'اختياري' : 'Optional'})</span>
            </label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all min-h-[80px]"
              placeholder={lang === 'ar' ? 'وصف قصير لما يفعله المشروع...' : 'A short description of what this project does...'}
            />
          </div>

          {/* Privacy & Sharing */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/50">
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isPublic} 
                onChange={e => setIsPublic(e.target.checked)}
                className="mt-1 w-5 h-5 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-900" 
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm font-bold text-white mb-1">
                  {isPublic ? <Globe size={16} className="text-emerald-400"/> : <Lock size={16} className="text-slate-400"/>}
                  {lang === 'ar' ? 'مشاركة في المعرض العام' : 'Share in Public Gallery'}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {lang === 'ar' 
                    ? 'سيتمكن الزوار من رؤية مشروعك، تجربته، ونسخه لحساباتهم.' 
                    : 'Visitors will be able to see, test, and clone your project.'}
                </p>
              </div>
            </label>

            {/* Price Option (Only if public) */}
            {isPublic && (
              <div className="mt-5 pt-5 border-t border-slate-800 animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {lang === 'ar' ? 'سعر الاستنساخ' : 'Cloning Price'}
                </label>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setPrice(0)}
                    className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all ${price === 0 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                  >
                    {t('free')}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPrice(5)}
                    className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all ${price > 0 ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                  >
                    <DollarSign size={16} /> {lang === 'ar' ? 'مدفوع' : 'Paid'}
                  </button>
                </div>
                
                {price > 0 && (
                  <div className="mt-3 relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input 
                      type="number" 
                      min="1" 
                      value={price} 
                      onChange={e => setPrice(e.target.value)}
                      className="w-full bg-slate-900 border border-amber-500/50 rounded-xl pl-9 pr-4 py-3 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose} 
              className="px-6 py-3 text-slate-300 hover:text-white text-sm font-bold transition-colors"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> {lang === 'ar' ? 'جارٍ الإنشاء...' : 'Creating...'}</>
              ) : (
                lang === 'ar' ? 'إنشاء والبدء' : 'Create & Start'
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
