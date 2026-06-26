'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../../store/useStore';
import { apiFetch } from '../../utils/api';
import { 
  Plus, Folder, Layers, Moon, Sun, LogOut, 
  ChevronRight, BarChart3, Database, FileText, Bot, HelpCircle 
} from 'lucide-react';

interface Project {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

interface Workspace {
  id: number;
  name: string;
}

export default function Dashboard() {
  const router = useRouter();
  
  // Zustand State
  const token = useStore((state) => state.token);
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
  const theme = useStore((state) => state.theme);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const activeWorkspaceId = useStore((state) => state.activeWorkspaceId);
  const setActiveWorkspaceId = useStore((state) => state.setActiveWorkspaceId);
  const setActiveProjectId = useStore((state) => state.setActiveProjectId);

  // Local State
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authentication check
  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
    }
  }, [token, router]);

  // Fetch Workspaces on load
  useEffect(() => {
    if (!token) return;
    
    const fetchWorkspaces = async () => {
      try {
        const data = await apiFetch('/workspaces');
        setWorkspaces(data);
        if (data.length > 0 && !activeWorkspaceId) {
          setActiveWorkspaceId(data[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchWorkspaces();
  }, [token, activeWorkspaceId, setActiveWorkspaceId]);

  // Fetch Projects when active workspace changes
  useEffect(() => {
    if (!activeWorkspaceId || !token) return;
    
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`/workspaces/${activeWorkspaceId}/projects`);
        setProjects(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [activeWorkspaceId, token]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !activeWorkspaceId) return;

    try {
      const data = await apiFetch(`/workspaces/${activeWorkspaceId}/projects`, {
        method: 'POST',
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDesc
        })
      });
      setProjects([...projects, data]);
      setNewProjectName('');
      setNewProjectDesc('');
      setShowCreateModal(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSelectProject = (projectId: number) => {
    setActiveProjectId(projectId);
    router.push(`/projects/${projectId}`);
  };

  if (!token) return null;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 glass-panel border-b rounded-none px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md">
              S
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-white">Sightfill Dashboard</span>
          </div>

          {/* Workspace Switcher */}
          {workspaces.length > 0 && (
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-slate-400" />
              <select 
                value={activeWorkspaceId || ''} 
                onChange={(e) => setActiveWorkspaceId(Number(e.target.value))}
                className="bg-transparent border-none text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                    {ws.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
            {user?.email}
          </span>
          
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          
          <button 
            onClick={logout} 
            className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors"
            title="Log Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        
        {/* Workspace Overview Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-panel p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Folder className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Projects</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">{projects.length}</h4>
            </div>
          </div>
          <div className="glass-panel p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Active Datasets</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">{projects.length > 0 ? 1 : 0}</h4>
            </div>
          </div>
          <div className="glass-panel p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Reports Created</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">{projects.length > 0 ? 3 : 0}</h4>
            </div>
          </div>
          <div className="glass-panel p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">AI Queries Used</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">2</h4>
            </div>
          </div>
        </section>

        {/* Projects Listing Headers */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Projects</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage and upload datasets for your business intelligence audits.</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-md shadow-indigo-600/10 transition-transform hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" /> Create Project
          </button>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-40 glass-panel animate-pulse bg-slate-200/50 dark:bg-slate-800/40"></div>
            ))}
          </div>
        ) : error ? (
          <div className="glass-panel p-8 text-center text-red-500">{error}</div>
        ) : projects.length === 0 ? (
          <div className="glass-panel p-12 text-center max-w-xl mx-auto mt-12 flex flex-col items-center">
            <Folder className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="font-bold text-lg text-slate-950 dark:text-white">No projects found</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-6">Create your first analytics project to begin uploading datasets.</p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-sm shadow-md"
            >
              Add Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div 
                key={project.id} 
                onClick={() => handleSelectProject(project.id)}
                className="glass-card p-6 flex flex-col justify-between cursor-pointer hover:border-indigo-500/50"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{project.name}</h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">
                    {project.description || 'No description provided.'}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-6 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                  <span>Open Cockpit</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="glass-panel max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">Create New Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Project Name
                </label>
                <input 
                  type="text" 
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Retail Sales Insights"
                  className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Description
                </label>
                <textarea 
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Enter project goals or details..."
                  rows={3}
                  className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
