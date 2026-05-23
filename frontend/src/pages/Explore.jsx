import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Copy, Heart, Eye } from 'lucide-react';

export default function Explore() {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/projects');
        const data = await response.json();
        setProjects(data.filter(p => p.isPublic));
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    };
    fetchProjects();
  }, []);

  const handleClone = async (project) => {
    try {
      const response = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${project.name} (Cloned)`,
          code: project.code,
          author: "You",
          isPublic: false,
        }),
      });
      const newProject = await response.json();
      navigate(`/editor/${newProject.id}`);
    } catch (error) {
      console.error('Failed to clone project:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-slate-900">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Sparkles size={20}/>
          </div>
          <span className="font-bold text-xl tracking-wide bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Capable</span>
        </Link>
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link to="/dashboard" className="text-slate-300 hover:text-white transition-colors">My Dashboard</Link>
          <Link to="/editor" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-all">Create New</Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Discover & Remix</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Explore thousands of AI-generated UI components and full pages created by the Capable community. Fork them with one click.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map(project => (
            <div key={project.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group">
              {/* Mock Preview Area */}
              <div className="h-48 bg-slate-800 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/90 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <button 
                    onClick={() => handleClone(project)}
                    className="bg-white text-slate-900 w-full text-center py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors"
                  >
                    <Copy size={16} /> Clone & Edit
                  </button>
                </div>
                <Sparkles className="text-slate-600 opacity-30" size={60} />
              </div>
              
              <div className="p-5">
                <h3 className="text-lg font-bold text-white mb-1">{project.name}</h3>
                <p className="text-sm text-slate-500 mb-4">by <span className="text-indigo-400">{project.author}</span></p>
                
                <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-4">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><Heart size={14} className="text-pink-500" /> {project.likes}</span>
                    <span className="flex items-center gap-1"><Eye size={14} /> {project.views}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}