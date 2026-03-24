import { useState, useEffect, createContext, useContext } from 'react';
import { supabasePro } from '../lib/supabasePro';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const [workspaces,       setWorkspaces]       = useState([]);
  const [activeWorkspace,  setActiveWorkspace]  = useState(null);
  const [loading,          setLoading]          = useState(true);

  useEffect(() => { loadWorkspaces(); }, []);

  const loadWorkspaces = async () => {
    const { data: { user } } = await supabasePro.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabasePro
      .from('workspaces')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    const list = data || [];
    setWorkspaces(list);

    // Restaurer le workspace actif depuis localStorage
    const saved = localStorage.getItem('vigie_active_workspace');
    const found = list.find(w => w.id === saved);
    setActiveWorkspace(found || list[0] || null);
    setLoading(false);
  };

  const switchWorkspace = (workspace) => {
    setActiveWorkspace(workspace);
    localStorage.setItem('vigie_active_workspace', workspace.id);
  };

  const createWorkspace = async (name) => {
    const { data: { user } } = await supabasePro.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabasePro
      .from('workspaces')
      .insert({ user_id: user.id, name })
      .select()
      .single();

    if (error) throw error;
    setWorkspaces(prev => [...prev, data]);
    return data;
  };

  const deleteWorkspace = async (id) => {
    await supabasePro.from('workspaces').delete().eq('id', id);
    const remaining = workspaces.filter(w => w.id !== id);
    setWorkspaces(remaining);
    if (activeWorkspace?.id === id) {
      switchWorkspace(remaining[0]);
    }
  };

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      activeWorkspace,
      loading,
      switchWorkspace,
      createWorkspace,
      deleteWorkspace,
      reload: loadWorkspaces,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return ctx;
}
