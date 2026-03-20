import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';

export interface DashboardData {
  projectsCount: number;
  financialTotal: {
    income: number;
    expense: number;
  };
  loading: boolean;
}

export const useDashboardData = (): DashboardData => {
  const [loading, setLoading] = useState(false);
  const [projectsCount, setProjectsCount] = useState(0);
  const [financialTotal, setFinancialTotal] = useState({ income: 0, expense: 0 });
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const { projects, selectedProjectId } = useProject();

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user || authLoading) return;

      try {
        setLoading(true);

        // Projects count = all projects the user has access to (via RLS)
        setProjectsCount(projects.length);

        if (!selectedProjectId) {
          setFinancialTotal({ income: 0, expense: 0 });
          return;
        }

        // Fetch financial data for the selected project
        const { data, error } = await supabase
          .from('cash_flow_entries')
          .select('movement_type, amount')
          .eq('project_id', selectedProjectId);

        if (error) throw error;

        const totalIncome = data?.filter(r => r.movement_type === 'entrada').reduce((sum, r) => sum + Number(r.amount), 0) || 0;
        const totalExpense = data?.filter(r => r.movement_type === 'saida').reduce((sum, r) => sum + Number(r.amount), 0) || 0;

        setFinancialTotal({ income: totalIncome, expense: totalExpense });
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: 'Erro ao carregar dados',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [toast, user, authLoading, selectedProjectId, projects.length]);

  return { projectsCount, financialTotal, loading };
};
