
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, FolderOpen, Calendar, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import PermissionGuard from '@/components/rbac/PermissionGuard';
import { useProject } from '@/contexts/ProjectContext';

interface Project {
  id: string;
  name: string;
  address: string;
  technical_manager: string;
  created_at: string;
}

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onDelete, onView }) => {
  const { selectedProjectId } = useProject();

  return (
    <Card className="hover:shadow-lg transition-all duration-300 bg-card border-border/50">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold mb-2" style={{ color: '#8b4a12' }}>{project.name}</CardTitle>
            <Badge className="bg-primary text-primary-foreground">Ativo</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onView(project.id)} className="h-8 w-8 p-0 border-border/50 hover:bg-accent/50">
              <FolderOpen className="h-4 w-4" />
            </Button>
            <PermissionGuard module="projetos" action="update" obraId={selectedProjectId}>
              <Button variant="outline" size="sm" onClick={() => onEdit(project)} className="h-8 w-8 p-0 border-border/50 hover:bg-accent/50">
                <Edit className="h-4 w-4" />
              </Button>
            </PermissionGuard>
            <PermissionGuard module="projetos" action="delete" obraId={selectedProjectId}>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10 border-border/50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border/50">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      Tem certeza que deseja excluir o projeto "{project.name}"? Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-border/50">Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(project.id)} className="bg-red-500 hover:bg-red-600">Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </PermissionGuard>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center text-sm text-white">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" /><span className="truncate">{project.address}</span>
          </div>
          <div className="flex items-center text-sm text-white">
            <User className="h-4 w-4 mr-2 text-muted-foreground" /><span>{project.technical_manager}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Criado em {format(new Date(project.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
