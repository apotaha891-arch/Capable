import React, { useState, useRef, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Sparkles, Send, Code2, Eye, Loader, Save } from 'lucide-react';

const NEW_PROJECT_CODE = `<!DOCTYPE html>
<html>
<head>
  <title>New Project</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-white flex items-center justify-center h-screen">
  <h1 class="text-4xl">Start creating something amazing!</h1>
</body>
</html>`;

export default function Editor() {
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('preview');
  const iframeRef = useRef(null);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProject = async () => {
      if (id) {
        try {
          const response = await fetch(`http://localhost:5000/api/projects/${id}`);
          if (response.ok) {
            const project = await response.json();
            setCode(project.code);
          } else {
            navigate('/editor'); // Redirect if project not found
          }
        } catch (error) {
          console.error('Failed to fetch project:', error);
        }
      } else {
        setCode(NEW_PROJECT_CODE);
      }
    };
    fetchProject();
  }, [id, navigate]);

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
        body: JSON.stringify({
          prompt: `Given this code:\n\n${code}\n\nApply the following change: ${prompt}`,
          history,
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      setCode(data.code);
      setHistory([...history, { prompt, code: data.code }]);
      setPrompt('');
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (id) {
        await fetch(`http://localhost:5000/api/projects/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
        });
      } else {
        // This case would need more logic for creating a new project from the editor
        alert("Please create a project from the dashboard or by cloning first.");
      }
    } catch (error) {
        console.error('Failed to save project:', error);
        alert('Failed to save project.');
    } finally {
        setSaving(false);
    }
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Sparkles size={20}/>
          </div>
          <span className="font-bold text-xl tracking-wide bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Capable</span>
        </Link>
        <div className="flex items-center gap-4">
          <button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
              {saving ? <Loader className="animate-spin" size={16}/> : <Save size={16}/>}
              Save
          </button>
          <Link to="/dashboard" className="text-slate-400 hover:text-white text-sm transition-colors">My Projects</Link>
          <Link to="/explore" className="text-slate-400 hover:text-white text-sm transition-colors">Explore</Link>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/3 border-r border-slate-800 bg-slate-900/50 p-6 overflow-y-auto flex flex-col">
          <h2 className="text-lg font-bold text-white mb-4">AI Assistant</h2>
          
          <form onSubmit={handleGenerate} className="mb-8 flex-1 flex flex-col">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to build... (e.g., 'Create a beautiful product card')"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none mb-3"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={18}/> Generating...
                </>
              ) : (
                <>
                  <Send size={18}/> Generate
                </>
              )}
            </button>
          </form>

          {history.length > 0 && (
            <div className="border-t border-slate-700 pt-6">
              <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase">History</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {history.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCode(item.code)}
                    className="w-full text-left text-xs p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white truncate transition-colors"
                    title={item.prompt}
                  >
                    {item.prompt.substring(0, 40)}...
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preview/Code Area */}
        <div className="w-2/3 flex flex-col">
          <div className="flex border-b border-slate-800 bg-slate-900">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === 'preview'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye size={16}/> Preview
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === 'code'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 size={16}/> Code
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === 'preview' ? (
              <iframe
                ref={iframeRef}
                title="Preview"
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full overflow-auto bg-slate-900 p-4 text-xs text-slate-300 font-mono border-none focus:outline-none"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
