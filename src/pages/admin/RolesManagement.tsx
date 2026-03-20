import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Shield, Loader2, Trash2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface Role {
  id: string;
  nome: string;
  descricao: string | null;
}

interface Permission {
  id: string;
  modulo: string;
  acao: string;
  descricao: string | null;
}

interface RolePermission {
  role_id: string;
  permission_id: string;
}

const MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'projetos', label: 'Projetos' },
  { key: 'documentacao', label: 'Documentação' },
  { key: 'orcamento', label: 'Orçamento' },
  { key: 'cronograma', label: 'Cronograma' },
  { key: 'cronograma_fisico_financeiro', label: 'Cronograma Físico-Financeiro' },
  { key: 'diario_obra', label: 'Diário de Obra' },
  { key: 'financeiro', label: 'Financeiro' },
  { key: 'fluxo_caixa', label: 'Fluxo de Caixa' },
  { key: 'arquivos', label: 'Arquivos' },
  { key: 'relatorios', label: 'Relatórios' },
  { key: 'configuracoes', label: 'Configurações' },
  { key: 'usuarios_obra', label: 'Usuários da Obra' },
];

const ACTIONS = [
  { key: 'create', label: 'Criar' },
  { key: 'read', label: 'Ler' },
  { key: 'update', label: 'Editar' },
  { key: 'delete', label: 'Excluir' },
  { key: 'export', label: 'Exportar' },
  { key: 'approve', label: 'Aprovar' },
];

const RolesManagement: React.FC = () => {
  const { role: globalRole, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [rolesRes, permsRes, rpRes] = await Promise.all([
      supabase.from('rbac_roles').select('*').order('created_at'),
      supabase.from('rbac_permissions').select('*').order('modulo, acao'),
      supabase.from('rbac_role_permissions').select('role_id, permission_id'),
    ]);
    if (rolesRes.data) setRoles(rolesRes.data);
    if (permsRes.data) setPermissions(permsRes.data);
    if (rpRes.data) setRolePermissions(rpRes.data);
    setLoading(false);
  };

  const handleTogglePermission = async (roleId: string, permissionId: string) => {
    const exists = rolePermissions.some(rp => rp.role_id === roleId && rp.permission_id === permissionId);
    if (exists) {
      const { error } = await supabase.from('rbac_role_permissions').delete().eq('role_id', roleId).eq('permission_id', permissionId);
      if (!error) setRolePermissions(prev => prev.filter(rp => !(rp.role_id === roleId && rp.permission_id === permissionId)));
    } else {
      const { error } = await supabase.from('rbac_role_permissions').insert({ role_id: roleId, permission_id: permissionId });
      if (!error) setRolePermissions(prev => [...prev, { role_id: roleId, permission_id: permissionId }]);
    }
  };

  const handleToggleModule = async (roleId: string, modulo: string) => {
    const modulePerms = permissions.filter(p => p.modulo === modulo);
    const allChecked = modulePerms.every(p => rolePermissions.some(rp => rp.role_id === roleId && rp.permission_id === p.id));

    for (const perm of modulePerms) {
      const exists = rolePermissions.some(rp => rp.role_id === roleId && rp.permission_id === perm.id);
      if (allChecked && exists) {
        await supabase.from('rbac_role_permissions').delete().eq('role_id', roleId).eq('permission_id', perm.id);
      } else if (!allChecked && !exists) {
        await supabase.from('rbac_role_permissions').insert({ role_id: roleId, permission_id: perm.id });
      }
    }
    // Refresh
    const { data } = await supabase.from('rbac_role_permissions').select('role_id, permission_id');
    if (data) setRolePermissions(data);
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.from('rbac_roles').insert({ nome: newRoleName, descricao: newRoleDesc || null }).select().single();
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else if (data) {
      setRoles(prev => [...prev, data]);
      setNewRoleName(''); setNewRoleDesc(''); setIsNewOpen(false);
      toast({ title: 'Papel criado com sucesso' });
    }
    setSaving(false);
  };

  const handleEditRole = async () => {
    if (!selectedRole || !editName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('rbac_roles').update({ nome: editName, descricao: editDesc || null }).eq('id', selectedRole.id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      setRoles(prev => prev.map(r => r.id === selectedRole.id ? { ...r, nome: editName, descricao: editDesc || null } : r));
      setSelectedRole({ ...selectedRole, nome: editName, descricao: editDesc || null });
      setIsEditOpen(false);
      toast({ title: 'Papel atualizado' });
    }
    setSaving(false);
  };

  const handleDeleteRole = async (roleId: string) => {
    const { error } = await supabase.from('rbac_roles').delete().eq('id', roleId);
    if (error) {
      toast({ title: 'Erro ao remover', description: 'Este papel pode estar vinculado a usuários.', variant: 'destructive' });
    } else {
      setRoles(prev => prev.filter(r => r.id !== roleId));
      if (selectedRole?.id === roleId) setSelectedRole(null);
      toast({ title: 'Papel removido' });
    }
  };

  const getPermissionId = (modulo: string, acao: string) => permissions.find(p => p.modulo === modulo && p.acao === acao)?.id;
  const hasRolePermission = (roleId: string, permId: string) => rolePermissions.some(rp => rp.role_id === roleId && rp.permission_id === permId);

  if (roleLoading) {
    return <AppLayout><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></AppLayout>;
  }

  if (globalRole !== 'admin') return <Navigate to="/" replace />;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão de Papéis e Permissões</h1>
            <p className="text-muted-foreground">Configure os papéis e suas permissões no sistema RBAC</p>
          </div>
          <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Novo Papel</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Papel</DialogTitle>
                <DialogDescription>Defina o nome e descrição do novo papel</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input placeholder="Nome do papel" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} />
                <Textarea placeholder="Descrição" value={newRoleDesc} onChange={e => setNewRoleDesc(e.target.value)} />
                <Button onClick={handleCreateRole} disabled={saving} className="w-full">
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Criar Papel
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Roles list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(role => (
            <Card
              key={role.id}
              className={`cursor-pointer transition-all ${selectedRole?.id === role.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedRole(role)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    {role.nome}
                  </span>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditName(role.nome); setEditDesc(role.descricao || ''); setSelectedRole(role); setIsEditOpen(true); }}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteRole(role.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>{role.descricao || 'Sem descrição'}</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">
                  {rolePermissions.filter(rp => rp.role_id === role.id).length} permissões
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Role Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Papel</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input placeholder="Nome" value={editName} onChange={e => setEditName(e.target.value)} />
              <Textarea placeholder="Descrição" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
              <Button onClick={handleEditRole} disabled={saving} className="w-full">
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Permission matrix */}
        {selectedRole && (
          <Card>
            <CardHeader>
              <CardTitle>Permissões: {selectedRole.nome}</CardTitle>
              <CardDescription>Marque as permissões para este papel. Clique no nome do módulo para marcar/desmarcar todas.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Módulo</TableHead>
                      {ACTIONS.map(a => (
                        <TableHead key={a.key} className="text-center">{a.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MODULES.map(mod => (
                      <TableRow key={mod.key}>
                        <TableCell
                          className="font-medium cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleToggleModule(selectedRole.id, mod.key)}
                        >
                          {mod.label}
                        </TableCell>
                        {ACTIONS.map(act => {
                          const permId = getPermissionId(mod.key, act.key);
                          if (!permId) return <TableCell key={act.key} className="text-center text-muted-foreground">—</TableCell>;
                          return (
                            <TableCell key={act.key} className="text-center">
                              <Checkbox
                                checked={hasRolePermission(selectedRole.id, permId)}
                                onCheckedChange={() => handleTogglePermission(selectedRole.id, permId)}
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default RolesManagement;
