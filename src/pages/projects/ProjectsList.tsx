
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/components/layout/AppLayout';
import ProjectCard from '@/components/projects/ProjectCard';
import NewProjectForm from '@/components/projects/NewProjectForm';
import EditProjectForm from '@/components/projects/EditProjectForm';
import { useAuth } from '@/contexts/AuthContext';
import PermissionGuard from '@/components/rbac/PermissionGuard';
import { useProject } from '@/contexts/ProjectContext';

interface Project {
  id: string;
  name: string;
  address: string;
  technical_manager: string;
  created_at: string;
  user_id: string;
}

const ProjectsList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { selectedProjectId } = useProject();

  useEffect(() => {
    if (!authLoading && user) fetchProjects();
  }, [user, authLoading]);

  const fetchProjects = async () => {
    if (!user) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      // RLS handles visibility - no need to filter by user_id
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast({ title: 'Erro ao carregar projetos', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      setProjects(projects.filter(project => project.id !== id));
      toast({ title: 'Projeto excluído', description: 'O projeto foi excluído com sucesso.' });
    } catch (error: any) {
      toast({ title: 'Erro ao excluir projeto', description: error.message, variant: 'destructive' });
    }
  };

  const handleEditProject = (project: Project) => { setEditProject(project); setFormOpen(true); };
  const handleViewProject = (id: string) => navigate(`/projects/${id}`);
  const handleFormClose = (refresh = false) => { setFormOpen(false); setEditProject(null); if (refresh) fetchProjects(); };

  const filteredProjects = projects.filter(project => {
    return project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           project.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
           project.technical_manager.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (authLoading) {
    return <AppLayout><div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-balix-accent mx-auto"></div><p className="mt-2 text-sm text-gray-500">Carregando...</p></div></AppLayout>;
  }

  if (!user) {
    return <AppLayout><div className="flex items-center justify-center py-12"><p className="text-lg text-gray-600">Você precisa estar logado para ver seus projetos.</p></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Projetos</h2>
            <p className="text-muted-foreground">Gerencie todos os seus projetos de construção.</p>
          </div>
          <PermissionGuard module="projetos" action="create" obraId={selectedProjectId}>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />Novo Projeto
            </Button>
          </PermissionGuard>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="Pesquisar por nome, endereço ou responsável..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-balix-accent mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Carregando projetos...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{searchTerm ? 'Nenhum projeto encontrado' : 'Nenhum projeto cadastrado'}</h3>
              <p className="text-gray-500 mb-4">{searchTerm ? 'Tente ajustar os filtros de pesquisa.' : 'Comece criando seu primeiro projeto.'}</p>
              {!searchTerm && (
                <Button onClick={() => setFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />Criar Primeiro Projeto
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} onEdit={handleEditProject} onDelete={handleDeleteProject} onView={handleViewProject} />
            ))}
          </div>
        )}

        {!isLoading && filteredProjects.length > 0 && (
          <div className="text-center text-sm text-gray-500">
            {filteredProjects.length === 1 ? '1 projeto encontrado' : `${filteredProjects.length} projetos encontrados`}
            {projects.length !== filteredProjects.length && ` de ${projects.length} total`}
          </div>
        )}

        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader><DialogTitle>{editProject ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle></DialogHeader>
            {editProject ? <EditProjectForm project={editProject} onClose={handleFormClose} /> : <NewProjectForm onClose={handleFormClose} />}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default ProjectsList;
