import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Globe, Lock, DollarSign } from 'lucide-react';
import { useLang } from '../i18n/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function NewProjectModal({ isOpen, onClose }) {
  const { t, lang } = useLang();
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

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
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-2 rounded-full">
            <X size={20} />
          </button>
        </div>
        
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
      </div>
    </div>
  );
}
