import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { sortAtividadesPrincipais } from '@/types/budget';

export interface MonthData {
  name: string;
  entradas: number;
  saidas: number;
}

export interface ActivityStatus {
  id: string;
  nome: string;
  progresso: number;
  valor: number;
  statusVisual: 'verde' | 'amarelo' | 'vermelho';
}

export interface DashboardData {
  projectsCount: number;
  financialTotal: {
    income: number;
    expense: number;
  };
  monthlyCashFlow: MonthData[];
  intelligentProgress: number;
  activitiesStatus: ActivityStatus[];
  recentImages: any[];
  expectedTotalCost: number;
  loading: boolean;
  userRole: string | null;
  paymentProgress: {
    totalAmount: number;
    paidAmount: number;
    percentage: number;
    totalInstallments: number;
    paidInstallments: number;
  };
}

export const useAdvancedDashboardData = (): DashboardData => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Omit<DashboardData, 'loading'>>({
    projectsCount: 0,
    financialTotal: { income: 0, expense: 0 },
    monthlyCashFlow: [],
    intelligentProgress: 0,
    activitiesStatus: [],
    recentImages: [],
    expectedTotalCost: 0,
    userRole: null,
    paymentProgress: {
      totalAmount: 0,
      paidAmount: 0,
      percentage: 0,
      totalInstallments: 0,
      paidInstallments: 0
    }
  });
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const { projects, selectedProjectId } = useProject();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      if (!user || authLoading) return;
      
      try {
        setLoading(true);

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        
        if (isMounted) setUserRole(profile?.role || null);
        const isClient = profile?.role === 'Cliente' || profile?.role === 'cliente';

        const projectsCount = projects.length;

        if (!selectedProjectId) {
          if (isMounted) {
            setData(prev => ({ ...prev, projectsCount }));
          }
          return;
        }

        const fetchPromises: any[] = [
          supabase.from('orcamentos')
            .select(`
              id, 
              atividade_principal, 
              orcamento_atividades(custo_total), 
              atividade_progresso(progresso, status)
            `)
            .eq('project_id', selectedProjectId),
            
          supabase.from('diario_imagens')
            .select(`
              id, 
              url_imagem, 
              created_at, 
              work_diary!inner(project_id, description, date)
            `)
            .eq('work_diary.project_id', selectedProjectId)
            .order('created_at', { ascending: false })
            .limit(8),
            
          (supabase as any).from('administracao')
            .select('*, administracao_parcelas(*)')
            .eq('project_id', selectedProjectId)
            .maybeSingle()
        ];

        if (!isClient) {
          fetchPromises.push(
            supabase.from('cash_flow_entries')
              .select('movement_type, amount, transaction_date')
              .eq('project_id', selectedProjectId)
          );
        }

        const results = await Promise.all(fetchPromises);
        const orcRes = results[0];
        const imgRes = results[1];
        const admRes = results[2];
        const cfRes = !isClient ? results[3] : { data: null, error: null };

        if (!isMounted) return;

        if (orcRes.error) console.warn('Orçamentos Error:', orcRes.error);
        if (imgRes.error) console.warn('Imagens Error:', imgRes.error);
        if (admRes.error) console.warn('Adm Error:', admRes.error);
        if (cfRes?.error) console.warn('Cash Flow Error:', cfRes.error);

        const orcamentosData = orcRes.data;
        const imagensData = imgRes.data;
        const cashFlowData = cfRes?.data;
        const admData = admRes.data as any;

        let totalIncome = 0;
        let totalExpense = 0;
        const monthlyMap: Record<string, { entradas: number; saidas: number }> = {};
        
        if (cashFlowData && !isClient) {
          cashFlowData.forEach(r => {
            const amount = Number(r.amount);
            if (r.movement_type === 'entrada') totalIncome += amount;
            else if (r.movement_type === 'saida') totalExpense += amount;
            
            if (r.transaction_date) {
               const date = new Date(`${r.transaction_date}T12:00:00Z`);
               const monthKey = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
               if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { entradas: 0, saidas: 0 };
               if (r.movement_type === 'entrada') monthlyMap[monthKey].entradas += amount;
               else monthlyMap[monthKey].saidas += amount;
            }
          });
        }
        
        const monthlyMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const monthlyCashFlow = Object.keys(monthlyMap).map(key => {
           const [m, y] = key.split('/');
           return { 
              name: `${monthlyMonths[parseInt(m)-1]}/${y.substring(2)}`, 
              entradas: monthlyMap[key].entradas, 
              saidas: monthlyMap[key].saidas,
              sortIdx: parseInt(y) * 100 + parseInt(m)
           };
        })
        .sort((a,b) => a.sortIdx - b.sortIdx)
        .slice(-6);

        let expectedTotalCost = 0;
        let sumWeightedProgress = 0;
        const activitiesStatus: ActivityStatus[] = [];

        if (orcamentosData && Array.isArray(orcamentosData)) {
          orcamentosData.forEach(orc => {
            const sumValor = (orc.orcamento_atividades as any[])?.reduce((acc: number, curr: any) => acc + Number(curr.custo_total || 0), 0) || 0;
            expectedTotalCost += sumValor;
            
            const arrProg = orc.atividade_progresso || [];
            const prog = Array.isArray(arrProg) ? (arrProg[0]?.progresso || 0) : ((arrProg as any).progresso || 0);
            
            let statusVisual: 'verde'|'amarelo'|'vermelho' = 'vermelho';
            if (prog >= 70) statusVisual = 'verde';
            else if (prog >= 30) statusVisual = 'amarelo';
            
            activitiesStatus.push({
               id: orc.id,
               nome: orc.atividade_principal,
               progresso: prog,
               valor: sumValor,
               statusVisual
            });
          });
          
          if (expectedTotalCost > 0) {
             activitiesStatus.forEach(act => {
                const weight = act.valor / expectedTotalCost;
                sumWeightedProgress += (weight * act.progresso);
             });
          }
        }
        
        const intelligentProgress = expectedTotalCost > 0 ? Math.min(100, Math.max(0, Math.round(sumWeightedProgress))) : 0;
        
        const recentImages = imagensData ? imagensData.map((img: any) => ({ 
           id: img.id, 
           url_imagem: img.url_imagem, 
           descricao: img.work_diary?.description || 'Sem descrição', 
           created_at: img.work_diary?.date || img.created_at 
        })) : [];

        // Administration calculations
        const parcelas = admData?.administracao_parcelas || [];
        let admTotalAmount = 0;
        let admPaidAmount = 0;
        let admTotalInstallments = parcelas.length;
        let admPaidInstallments = 0;

        parcelas.forEach((p: any) => {
          const val = Number(p.valor);
          admTotalAmount += val;
          if (p.status === 'pago') {
            admPaidAmount += val;
            admPaidInstallments++;
          }
        });

        const admPercentage = admTotalAmount > 0 ? Math.round((admPaidAmount / admTotalAmount) * 100) : 0;

        setData({
          projectsCount,
          financialTotal: isClient ? { income: 0, expense: 0 } : { income: totalIncome, expense: totalExpense },
          monthlyCashFlow: isClient ? [] : monthlyCashFlow,
          intelligentProgress,
          activitiesStatus: sortAtividadesPrincipais(activitiesStatus),
          recentImages,
          expectedTotalCost,
          userRole: profile?.role || null,
          paymentProgress: {
            totalAmount: admTotalAmount,
            paidAmount: admPaidAmount,
            percentage: admPercentage,
            totalInstallments: admTotalInstallments,
            paidInstallments: admPaidInstallments
          }
        });
        
      } catch (error: any) {
        if (isMounted) {
            console.error(error);
            toast({ title: 'Aviso', description: 'Erro ao carregar indicadores do dashboard.', variant: 'destructive' });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDashboardData();

    return () => {
        isMounted = false;
    };
  }, [toast, user, authLoading, selectedProjectId, projects.length]);

  return { ...data, loading, userRole };
};
