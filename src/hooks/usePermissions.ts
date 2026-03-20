import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

export type RbacAction = 'create' | 'read' | 'update' | 'delete' | 'export' | 'approve';

export type RbacModule =
  | 'dashboard' | 'projetos' | 'documentacao' | 'orcamento'
  | 'cronograma' | 'cronograma_fisico_financeiro' | 'diario_obra'
  | 'financeiro' | 'fluxo_caixa' | 'arquivos' | 'relatorios'
  | 'configuracoes' | 'usuarios_obra';

interface Permission {
  modulo: string;
  acao: string;
}

interface ObraRole {
  role_id: string;
  role_nome: string;
}

export const usePermissions = (obraId?: string | null) => {
  const { user } = useAuth();
  const { role: globalRole } = useUserRole();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [obraRole, setObraRole] = useState<ObraRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user?.id) {
        setPermissions([]);
        setObraRole(null);
        setLoading(false);
        return;
      }

      // If user is global admin, grant all permissions
      if (globalRole === 'admin') {
        setObraRole({ role_id: '', role_nome: 'Administrador' });
        // Build full permission set
        const modules: RbacModule[] = [
          'dashboard', 'projetos', 'documentacao', 'orcamento', 'cronograma',
          'cronograma_fisico_financeiro', 'diario_obra', 'financeiro',
          'fluxo_caixa', 'arquivos', 'relatorios', 'configuracoes', 'usuarios_obra'
        ];
        const actions: RbacAction[] = ['create', 'read', 'update', 'delete', 'export', 'approve'];
        const allPerms = modules.flatMap(m => actions.map(a => ({ modulo: m, acao: a })));
        setPermissions(allPerms);
        setLoading(false);
        return;
      }

      if (!obraId) {
        // No obra selected - check if user is project owner (legacy behavior)
        setPermissions([]);
        setObraRole(null);
        setLoading(false);
        return;
      }

      try {
        // Check if user is project owner
        const { data: project } = await supabase
          .from('projects')
          .select('user_id')
          .eq('id', obraId)
          .single();

        if (project?.user_id === user.id) {
          // Project owner gets all permissions
          const modules: RbacModule[] = [
            'dashboard', 'projetos', 'documentacao', 'orcamento', 'cronograma',
            'cronograma_fisico_financeiro', 'diario_obra', 'financeiro',
            'fluxo_caixa', 'arquivos', 'relatorios', 'configuracoes', 'usuarios_obra'
          ];
          const actions: RbacAction[] = ['create', 'read', 'update', 'delete', 'export', 'approve'];
          setPermissions(modules.flatMap(m => actions.map(a => ({ modulo: m, acao: a }))));
          setObraRole({ role_id: '', role_nome: 'Proprietário' });
          setLoading(false);
          return;
        }

        // Get permissions from RBAC system
        const { data: perms, error: permsError } = await supabase.rpc('get_user_obra_permissions', {
          _user_id: user.id,
          _obra_id: obraId
        });

        if (permsError) {
          console.error('Error fetching permissions:', permsError);
        } else {
          setPermissions((perms as Permission[]) || []);
        }

        // Get obra role
        const { data: roleData, error: roleError } = await supabase.rpc('get_user_obra_role', {
          _user_id: user.id,
          _obra_id: obraId
        });

        if (!roleError && roleData && (roleData as ObraRole[]).length > 0) {
          setObraRole((roleData as ObraRole[])[0]);
        }
      } catch (error) {
        console.error('Error in usePermissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user?.id, obraId, globalRole]);

  const hasPermission = useCallback((modulo: RbacModule, acao: RbacAction): boolean => {
    if (globalRole === 'admin') return true;
    return permissions.some(p => p.modulo === modulo && p.acao === acao);
  }, [permissions, globalRole]);

  const canRead = useCallback((modulo: RbacModule) => hasPermission(modulo, 'read'), [hasPermission]);
  const canCreate = useCallback((modulo: RbacModule) => hasPermission(modulo, 'create'), [hasPermission]);
  const canUpdate = useCallback((modulo: RbacModule) => hasPermission(modulo, 'update'), [hasPermission]);
  const canDelete = useCallback((modulo: RbacModule) => hasPermission(modulo, 'delete'), [hasPermission]);
  const canExport = useCallback((modulo: RbacModule) => hasPermission(modulo, 'export'), [hasPermission]);
  const canApprove = useCallback((modulo: RbacModule) => hasPermission(modulo, 'approve'), [hasPermission]);

  return {
    permissions,
    obraRole,
    loading,
    hasPermission,
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    canExport,
    canApprove,
    isAdmin: globalRole === 'admin',
    roleName: obraRole?.role_nome || (globalRole === 'admin' ? 'Administrador' : null),
  };
};
