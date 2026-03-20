
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { AtividadeWithExecucoes, OrcamentoWithAtividades, OrcamentoAtividade } from '@/types/budget';
import ScheduleFinancialTable from '@/components/budget/ScheduleFinancialTable';
import ScheduleFilters from '@/components/budget/ScheduleFilters';
import { addDays, startOfWeek } from 'date-fns';

const ScheduleFinancial = () => {
  const [orcamentos, setOrcamentos] = useState<OrcamentoWithAtividades[]>([]);
  const [atividades, setAtividades] = useState<AtividadeWithExecucoes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 90));
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const { selectedProjectId } = useProject();

  useEffect(() => {
    if (!authLoading && user && selectedProjectId) {
      fetchData();
    }
  }, [user, authLoading, selectedProjectId]);

  const fetchData = async () => {
    if (!user || !selectedProjectId) return;
    
    setIsLoading(true);
    try {
      const { data: orcamentosData, error: orcamentosError } = await supabase
        .from('orcamentos')
        .select(`
          *,
          orcamento_atividades (*)
        `)
        .eq('project_id', selectedProjectId)
        .order('created_at', { ascending: false });

      if (orcamentosError) {
        console.error('Error fetching budget data:', orcamentosError);
        throw orcamentosError;
      }

      // Convert the data to match our types
      const formattedOrcamentos: OrcamentoWithAtividades[] = orcamentosData?.map(orcamento => ({
        ...orcamento,
        atividades: (orcamento.orcamento_atividades || []).map((atividade: any): OrcamentoAtividade => ({
          ...atividade,
          unidade: atividade.unidade as 'm' | 'm²' | 'm³' | 'vb',
          custo_total: atividade.custo_total || (atividade.custo_material + atividade.custo_mao_obra)
        }))
      })) || [];

      // Buscar execuções para cada atividade
      const allAtividades: AtividadeWithExecucoes[] = [];
      
      for (const orcamento of formattedOrcamentos) {
        for (const atividade of orcamento.atividades) {
          const { data: execucoesData, error: execucoesError } = await supabase
            .from('cronograma_execucoes')
            .select('*')
            .eq('atividade_id', atividade.id)
            .order('data_inicio_semana', { ascending: true });

          if (execucoesError) {
            console.error('Error fetching executions:', execucoesError);
            throw execucoesError;
          }

          allAtividades.push({
            ...atividade,
            execucoes: execucoesData || []
          });
        }
      }
      
      console.log('Fetched schedule data:', { orcamentos: formattedOrcamentos, atividades: allAtividades });
      setOrcamentos(formattedOrcamentos);
      setAtividades(allAtividades);
    } catch (error: any) {
      console.error('Error fetching schedule data:', error);
      toast({
        title: 'Erro ao carregar cronograma',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePeriod = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const generateWeeks = () => {
    const weeks: Date[] = [];
    let current = startOfWeek(startDate, { weekStartsOn: 1 });
    
    while (current <= endDate) {
      weeks.push(new Date(current));
      current = addDays(current, 7);
    }
    
    return weeks;
  };

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#dda23a]"></div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-lg text-[#d6d6d6]">Você precisa estar logado para ver o cronograma físico-financeiro.</p>
        </div>
      </AppLayout>
    );
  }

  const weeks = generateWeeks();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#8b4a12]">Cronograma Físico-Financeiro</h2>
            <p className="text-[#d6d6d6]">
              Acompanhe o progresso semanal das atividades orçamentárias.
            </p>
          </div>
        </div>

        <ScheduleFilters 
          startDate={startDate}
          endDate={endDate}
          onUpdatePeriod={handleUpdatePeriod}
        />

        <ScheduleFinancialTable 
          orcamentos={orcamentos}
          atividades={atividades}
          weeks={weeks}
          onRefresh={fetchData}
          isLoading={isLoading}
        />
      </div>
    </AppLayout>
  );
};

export default ScheduleFinancial;
