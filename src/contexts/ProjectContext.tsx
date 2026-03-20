import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

interface Project {
  id: string;
  name: string;
  address: string;
  technical_manager: string;
}

interface ObraRole {
  role_id: string;
  role_nome: string;
}

interface Permission {
  modulo: string;
  acao: string;
}

interface ProjectContextType {
  projects: Project[];
  selectedProject: Project | null;
  selectedProjectId: string | null;
  selectProject: (projectId: string) => void;
  isLoading: boolean;
  refreshProjects: () => Promise<void>;
  // Role & permissions for current user in selected project
  currentRole: ObraRole | null;
  permissions: Permission[];
  permissionsLoading: boolean;
  hasPermission: (modulo: string, acao: string) => boolean;
  isAdmin: boolean;
}

const ProjectContext = createContext<ProjectContextType>({
  projects: [],
  selectedProject: null,
  selectedProjectId: null,
  selectProject: () => {},
  isLoading: true,
  refreshProjects: async () => {},
  currentRole: null,
  permissions: [],
  permissionsLoading: true,
  hasPermission: () => false,
  isAdmin: false,
});

export const useProject = () => useContext(ProjectContext);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const { role: globalRole } = useUserRole();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState<ObraRole | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  const isAdmin = globalRole === 'admin';

  const fetchProjects = async () => {
    if (!user) {
      setProjects([]);
      setSelectedProjectId(null);
      setIsLoading(false);
      return;
    }

    try {
      // RLS handles visibility - owners + obra_users members can see projects
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, address, technical_manager');

      if (error) throw error;

      const allProjects = data || [];
      setProjects(allProjects);

      // Restore selected project from localStorage or auto-select first
      const stored = localStorage.getItem(`balix_selected_project_${user.id}`);
      if (stored && allProjects.some(p => p.id === stored)) {
        setSelectedProjectId(stored);
      } else if (allProjects.length > 0) {
        setSelectedProjectId(allProjects[0].id);
        localStorage.setItem(`balix_selected_project_${user.id}`, allProjects[0].id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch role & permissions whenever selectedProjectId changes
  const fetchRoleAndPermissions = useCallback(async () => {
    if (!user?.id || !selectedProjectId) {
      setCurrentRole(null);
      setPermissions([]);
      setPermissionsLoading(false);
      return;
    }

    setPermissionsLoading(true);

    // Admin gets all permissions
    if (isAdmin) {
      setCurrentRole({ role_id: '', role_nome: 'Administrador' });
      const modules = [
        'dashboard', 'projetos', 'documentacao', 'orcamento', 'cronograma',
        'cronograma_fisico_financeiro', 'diario_obra', 'financeiro',
        'fluxo_caixa', 'arquivos', 'relatorios', 'configuracoes', 'usuarios_obra'
      ];
      const actions = ['create', 'read', 'update', 'delete', 'export', 'approve'];
      setPermissions(modules.flatMap(m => actions.map(a => ({ modulo: m, acao: a }))));
      setPermissionsLoading(false);
      return;
    }

    try {
      // Check if user is project owner
      const { data: project } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', selectedProjectId)
        .single();

      if (project?.user_id === user.id) {
        setCurrentRole({ role_id: '', role_nome: 'Proprietário' });
        const modules = [
          'dashboard', 'projetos', 'documentacao', 'orcamento', 'cronograma',
          'cronograma_fisico_financeiro', 'diario_obra', 'financeiro',
          'fluxo_caixa', 'arquivos', 'relatorios', 'configuracoes', 'usuarios_obra'
        ];
        const actions = ['create', 'read', 'update', 'delete', 'export', 'approve'];
        setPermissions(modules.flatMap(m => actions.map(a => ({ modulo: m, acao: a }))));
        setPermissionsLoading(false);
        return;
      }

      // Get role from obra_users
      const { data: roleData, error: roleError } = await supabase.rpc('get_user_obra_role', {
        _user_id: user.id,
        _obra_id: selectedProjectId
      });

      if (!roleError && roleData && (roleData as ObraRole[]).length > 0) {
        setCurrentRole((roleData as ObraRole[])[0]);
      } else {
        setCurrentRole(null);
      }

      // Get permissions from RBAC
      const { data: perms, error: permsError } = await supabase.rpc('get_user_obra_permissions', {
        _user_id: user.id,
        _obra_id: selectedProjectId
      });

      if (!permsError) {
        setPermissions((perms as Permission[]) || []);
      } else {
        console.error('Error fetching permissions:', permsError);
        setPermissions([]);
      }
    } catch (error) {
      console.error('Error in fetchRoleAndPermissions:', error);
      setCurrentRole(null);
      setPermissions([]);
    } finally {
      setPermissionsLoading(false);
    }
  }, [user?.id, selectedProjectId, isAdmin]);

  useEffect(() => {
    if (!authLoading) {
      fetchProjects();
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchRoleAndPermissions();
  }, [fetchRoleAndPermissions]);

  const selectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    if (user) {
      localStorage.setItem(`balix_selected_project_${user.id}`, projectId);
    }
  };

  const hasPermission = useCallback((modulo: string, acao: string): boolean => {
    if (isAdmin) return true;
    return permissions.some(p => p.modulo === modulo && p.acao === acao);
  }, [permissions, isAdmin]);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  return (
    <ProjectContext.Provider value={{
      projects,
      selectedProject,
      selectedProjectId,
      selectProject,
      isLoading,
      refreshProjects: fetchProjects,
      currentRole,
      permissions,
      permissionsLoading,
      hasPermission,
      isAdmin,
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export default ProjectContext;
