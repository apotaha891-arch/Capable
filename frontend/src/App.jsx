import React, { useState, useEffect, useRef } from 'react';
import { Play, Code, MessageSquare, Sparkles, RefreshCw, Layers } from 'lucide-react';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-900 text-white flex flex-col items-center justify-center h-screen font-sans">
        <h1 class="text-4xl font-bold mb-4 text-indigo-400">منصة Capable جاهزة!</h1>
        <p class="text-slate-400">اكتب فكرتك في القائمة الجانبية وشاهد السحر يتجسد هنا.</p>
    </body>
    </html>
  `);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('preview'); // preview أو code
  const iframeRef = useRef(null);

  // تحديث الـ iframe كلما تغير الكود المولد
  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = code;
    }
  }, [code]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history }),
      });

      const data = await response.json();
      if (data.code) {
        setCode(data.code);
        // حفظ التاريخ لتفعيل حلقة التعديل المستمر
        setHistory([...history, { role: 'user', content: prompt }, { role: 'model', content: data.code }]);
        setPrompt('');
      } else {
        alert(data.error || 'شيء ما سار بشكل خاطئ');
      }
    } catch (err) {
      console.error(err);
      alert('فشل الاتصال بمحرك المنصة الخلفي');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      
      <div className="w-1/3 border-r border-slate-800 flex flex-col h-full bg-slate-900">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Sparkles size={20}/>
            </div>
            <span className="font-bold text-xl tracking-wide bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Capable</span>
          </div>
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full border border-slate-700">v1.0 MVP</span>
        </div>

        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-xl text-sm text-slate-400">
            👋 أهلاً بك في **Capable**. صِف الواجهة أو التطبيق الذي تريده (مثال: "صفحة هبوط لتطبيق توصيل طعام مع جدول أسعار") وسأقوم ببنائه فوراُ.
          </div>
          {history.filter(m => m.role === 'user').map((msg, i) => (
            <div key={i} className="bg-indigo-950/40 border border-indigo-900/50 p-3 rounded-xl text-sm">
              <span className="text-indigo-400 font-semibold block mb-1">تعديل #{i+1}:</span>
              {msg.content}
            </div>
          ))}
        </div>

        
        <form onSubmit={handleGenerate} className="p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="صِف تطبيقك أو التعديل المطلوبة هنا..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-12 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none h-24"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute bottom-3 left-3 bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-all disabled:bg-slate-800 disabled:text-slate-600"
            >
              {loading ? <RefreshCw size={18} class="animate-spin"/> : <Play size={18}/>}
            </button>
          </div>
        </form>
      </div>

      
      <div className="flex-1 flex flex-col h-full bg-slate-950">
        
        <div className="h-14 border-b border-slate-800 px-4 flex items-center justify-between bg-slate-900">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'preview' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
                            <Layers size={14}/>
              العرض الحي
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'code' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
                            <Code size={14}/>
              رؤية الكود (Source)
            </button>
          </div>
        </div>

        
        <div className="flex-1 bg-white relative">
          {activeTab === 'preview' ? (
            <iframe
              ref={iframeRef}
              title="Capable Sandbox"
              className="w-full h-full border-none bg-white"
              sandbox="allow-scripts"
            />
          ) : (
            <pre className="w-full h-full bg-slate-950 text-emerald-400 p-6 overflow-auto font-mono text-sm selection:bg-slate-800">
              <code>{code}</code>
            </pre>
          )}
        </div>
      </div>

    </div>
  );
}