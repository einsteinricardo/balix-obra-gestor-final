import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import ProgressTable from '@/components/progress/ProgressTable';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { ATIVIDADES_PRINCIPAIS } from '@/types/budget';

const ProjectProgress = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const { selectedProjectId } = useProject();

  useEffect(() => {
    if (!authLoading && user && selectedProjectId) fetchRecords();
  }, [user, authLoading, selectedProjectId]);

  const fetchRecords = async () => {
    if (!user || !selectedProjectId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orcamentos')
        .select(`
          id,
          atividade_principal,
          created_at,
          atividade_progresso (
            id,
            status,
            data_inicio,
            data_fim,
            progresso
          )
        `)
        .eq('project_id', selectedProjectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const mappedData = (data || []).map((item: any) => {
        const progressoDb = Array.isArray(item.atividade_progresso) 
          ? item.atividade_progresso[0] 
          : item.atividade_progresso;
          
        return {
          id: item.id,
          stage_name: item.atividade_principal,
          start_date: progressoDb?.data_inicio || '',
          end_date: progressoDb?.data_fim || '',
          execution_percentage: progressoDb?.progresso || 0,
          status: progressoDb?.status || 'pendente',
        };
      });
      
      mappedData.sort((a, b) => {
        const idxA = ATIVIDADES_PRINCIPAIS.indexOf(a.stage_name as any);
        const idxB = ATIVIDADES_PRINCIPAIS.indexOf(b.stage_name as any);
        const posA = idxA === -1 ? 999 : idxA;
        const posB = idxB === -1 ? 999 : idxB;
        return posA - posB;
      });

      setRecords(mappedData);
    } catch (error: any) {
      toast({ title: 'Erro ao carregar orçamentos de progresso', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) return <AppLayout><div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-balix-accent"></div></div></AppLayout>;
  if (!user) return <AppLayout><div className="text-center py-12"><p className="text-lg text-gray-600">Você precisa estar logado para ver o progresso.</p></div></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-balix-dark">Etapas e Progresso</h2>
            <p className="text-muted-foreground">Acompanhe o grau de execução das atividades previstas no seu orçamento.</p>
          </div>
        </div>

        <ProgressTable records={records} onEdit={() => {}} onDelete={() => {}} isLoading={isLoading} />
      </div>
    </AppLayout>
  );
};

export default ProjectProgress;
