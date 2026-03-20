import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, Users, Loader2, Search } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface ObraUserRow {
  id: string;
  obra_id: string;
  usuario_id: string;
  role_id: string;
  created_at: string;
}

interface Role {
  id: string;
  nome: string;
}

interface Project {
  id: string;
  name: string;
}

interface ProfileInfo {
  id: string;
  full_name: string;
}

const ObraUsers: React.FC = () => {
  const { role: globalRole, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [obraUsers, setObraUsers] = useState<ObraUserRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [profiles, setProfiles] = useState<ProfileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filterProject, setFilterProject] = useState('all');
  const [addProject, setAddProject] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [addRole, setAddRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRoleId, setEditRoleId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [rolesRes, projectsRes, obraUsersRes, profilesRes] = await Promise.all([
      supabase.from('rbac_roles').select('id, nome'),
      supabase.from('projects').select('id, name'),
      supabase.from('obra_users').select('*'),
      supabase.from('profiles').select('id, full_name'),
    ]);

    if (rolesRes.data) setRoles(rolesRes.data);
    if (projectsRes.data) setProjects(projectsRes.data);
    if (obraUsersRes.data) setObraUsers(obraUsersRes.data);
    if (profilesRes.data) setProfiles(profilesRes.data);
    setLoading(false);
  };

  const getUserName = (userId: string) => {
    const p = profiles.find(pr => pr.id === userId);
    return p?.full_name || userId.slice(0, 8) + '...';
  };

  const getRoleName = (roleId: string) => roles.find(r => r.id === roleId)?.nome || '—';
  const getProjectName = (projectId: string) => projects.find(p => p.id === projectId)?.name || '—';

  const filteredProfiles = profiles.filter(p =>
    p.full_name.toLowerCase().includes(searchUser.toLowerCase())
  );

  const handleAddUser = async () => {
    if (!addProject || !selectedUserId || !addRole) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    // Check for duplicates
    const exists = obraUsers.some(ou => ou.obra_id === addProject && ou.usuario_id === selectedUserId);
    if (exists) {
      toast({ title: 'Usuário já está associado a esta obra', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { data, error } = await supabase
      .from('obra_users')
      .insert({ obra_id: addProject, usuario_id: selectedUserId, role_id: addRole })
      .select()
      .single();

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else if (data) {
      setObraUsers(prev => [...prev, data]);
      setSearchUser('');
      setSelectedUserId('');
      setAddRole('');
      setAddProject('');
      setIsAddOpen(false);
      toast({ title: 'Usuário adicionado à obra com sucesso' });
    }
    setSaving(false);
  };

  const handleUpdateRole = async (id: string) => {
    if (!editRoleId) return;
    const { error } = await supabase.from('obra_users').update({ role_id: editRoleId }).eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      setObraUsers(prev => prev.map(ou => ou.id === id ? { ...ou, role_id: editRoleId } : ou));
      setEditingId(null);
      toast({ title: 'Papel atualizado com sucesso' });
    }
  };

  const handleRemoveUser = async (id: string) => {
    const { error } = await supabase.from('obra_users').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      setObraUsers(prev => prev.filter(ou => ou.id !== id));
      toast({ title: 'Usuário removido da obra' });
    }
  };

  if (roleLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (globalRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const displayUsers = filterProject === 'all'
    ? obraUsers
    : obraUsers.filter(ou => ou.obra_id === filterProject);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Usuários da Obra</h1>
            <p className="text-muted-foreground">Gerencie os usuários e seus papéis em cada obra</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Adicionar Usuário</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Usuário à Obra</DialogTitle>
                <DialogDescription>Associe um usuário a uma obra com um papel específico</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Obra</label>
                  <Select value={addProject} onValueChange={setAddProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a obra" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Usuário</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome..."
                      value={searchUser}
                      onChange={e => { setSearchUser(e.target.value); setSelectedUserId(''); }}
                      className="pl-9"
                    />
                  </div>
                  {searchUser && !selectedUserId && (
                    <div className="border rounded-md mt-1 max-h-32 overflow-auto bg-background">
                      {filteredProfiles.length === 0 ? (
                        <p className="p-2 text-sm text-muted-foreground">Nenhum usuário encontrado</p>
                      ) : (
                        filteredProfiles.slice(0, 10).map(p => (
                          <button
                            key={p.id}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                            onClick={() => { setSelectedUserId(p.id); setSearchUser(p.full_name); }}
                          >
                            {p.full_name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  {selectedUserId && (
                    <p className="text-xs text-muted-foreground mt-1">Selecionado: {searchUser}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Papel</label>
                  <Select value={addRole} onValueChange={setAddRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o papel" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleAddUser} disabled={saving || !selectedUserId} className="w-full">
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Adicionar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Filtrar por Obra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder="Todas as obras" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as obras</SelectItem>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Obra</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Adicionado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Nenhum usuário associado
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayUsers.map(ou => (
                      <TableRow key={ou.id}>
                        <TableCell className="font-medium">{getUserName(ou.usuario_id)}</TableCell>
                        <TableCell>{getProjectName(ou.obra_id)}</TableCell>
                        <TableCell>
                          {editingId === ou.id ? (
                            <div className="flex items-center gap-2">
                              <Select value={editRoleId} onValueChange={setEditRoleId}>
                                <SelectTrigger className="w-[160px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {roles.map(r => (
                                    <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button size="sm" onClick={() => handleUpdateRole(ou.id)}>Salvar</Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
                            </div>
                          ) : (
                            <Badge variant="secondary">{getRoleName(ou.role_id)}</Badge>
                          )}
                        </TableCell>
                        <TableCell>{new Date(ou.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setEditingId(ou.id); setEditRoleId(ou.role_id); }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveUser(ou.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ObraUsers;
