import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, File, ListChecks, Users, Wallet } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  address: string;
  technical_manager: string;
  created_at: string;
}

const ProjectDetails = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (error) {
          throw new Error(error.message);
        }

        setProject(data);
      } catch (error: any) {
        console.error("Error fetching project details:", error);
        toast({
          title: 'Erro ao carregar detalhes do projeto',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [projectId, toast]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-balix-accent"></div>
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-balix-light">Projeto não encontrado.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold font-playfair">{project.name}</h2>
              <p className="text-balix-light/80">{project.address}</p>
            </div>
            <Link to={`/projects/${projectId}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Editar Projeto
              </Button>
            </Link>
          </div>
        </div>

        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Informações do Projeto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center space-x-4">
                <ListChecks className="h-5 w-5 text-balix-accent" />
                <div>
                  <p className="text-sm font-medium text-balix-light">Endereço</p>
                  <p className="text-lg">{project.address}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Users className="h-5 w-5 text-balix-accent" />
                <div>
                  <p className="text-sm font-medium text-balix-light">Responsável Técnico</p>
                  <p className="text-lg">{project.technical_manager}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8">
          <h3 className="text-2xl font-bold font-playfair mb-4">Navegação</h3>
          <div className="flex flex-col gap-2">
            
            <Link 
              to={`/projects/${projectId}/documents`} 
              className="flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <File className="h-5 w-5 mr-2 text-balix-accent" />
              <span>Documentos</span>
            </Link>
            
            
            <Link 
              to={`/projects/${projectId}/financial`} 
              className="flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Wallet className="h-5 w-5 mr-2 text-balix-accent" />
              <span>Financeiro</span>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProjectDetails;
