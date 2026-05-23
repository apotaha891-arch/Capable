import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Plus, Clock, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const [myProjects, setMyProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/projects');
        const data = await response.json();
        // Assuming projects for the current user are not public
        setMyProjects(data.filter(p => !p.isPublic));
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    };
    fetchProjects();
  }, []);

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/projects/${id}`, {
        method: 'DELETE',
      });
      setMyProjects(myProjects.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete project:', error);
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
        <div className="flex items-center gap-4">
          <img src="https://i.pravatar.cc/150?img=11" alt="User" className="w-10 h-10 rounded-full border-2 border-slate-700"/>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-12">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Projects</h1>
            <p className="text-slate-400">Manage your generated interfaces and apps.</p>
          </div>
          <Link to="/editor" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20">
            <Plus size={20}/> New Project
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myProjects.map(project => (
            <div key={project.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group hover:border-indigo-500/50 transition-colors">
              <div className="h-32 bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center border-b border-slate-800">
                 <Sparkles className="text-indigo-300 opacity-50" size={40} />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">{project.name}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-6">
                  <Clock size={14}/> {new Date(project.lastEdited).toLocaleString()}
                </p>
                <div className="flex gap-3">
                  <Link 
                    to={`/editor/${project.id}`}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-center py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Edit
                  </Link>
                  <button 
                    onClick={() => handleDelete(project.id)}
                    className="flex-1 border border-slate-700 hover:border-red-500 hover:text-red-500 text-slate-300 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Trash2 size={16} className="mx-auto" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}