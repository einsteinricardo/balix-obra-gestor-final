import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { OrcamentoWithAtividades, OrcamentoAtividade, ATIVIDADES_PRINCIPAIS } from '@/types/budget';
import BudgetTable from '@/components/budget/BudgetTable';
import BudgetForm, { EditingAtividade } from '@/components/budget/BudgetForm';
import ExcelImportModal from '@/components/budget/ExcelImportModal';
import PermissionGuard from '@/components/rbac/PermissionGuard';

const Budget = () => {
  const [orcamentos, setOrcamentos] = useState<OrcamentoWithAtividades[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingData, setEditingData] = useState<EditingAtividade | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const { selectedProjectId } = useProject();

  useEffect(() => {
    if (!authLoading && user && selectedProjectId) {
      fetchOrcamentos();
    }
  }, [user, authLoading, selectedProjectId]);

  const fetchOrcamentos = async () => {
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
      
      // Convert the data to match our types and sort by ATIVIDADES_PRINCIPAIS order
      const formattedData: OrcamentoWithAtividades[] = orcamentosData?.map(orcamento => ({
        ...orcamento,
        atividades: (orcamento.orcamento_atividades || []).map((atividade: any): OrcamentoAtividade => ({
          ...atividade,
          unidade: atividade.unidade as 'm' | 'm²' | 'm³' | 'vb',
          custo_total: atividade.custo_total || ((atividade.custo_material + atividade.custo_mao_obra) * atividade.quantidade)
        }))
      })) || [];

      // Sort by the order defined in ATIVIDADES_PRINCIPAIS
      formattedData.sort((a, b) => {
        const indexA = ATIVIDADES_PRINCIPAIS.indexOf(a.atividade_principal as any);
        const indexB = ATIVIDADES_PRINCIPAIS.indexOf(b.atividade_principal as any);
        return indexA - indexB;
      });
      
      console.log('Fetched budget data:', formattedData);
      setOrcamentos(formattedData);
    } catch (error: any) {
      console.error('Error fetching budget data:', error);
      toast({
        title: 'Erro ao carregar orçamentos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormClose = (refresh = false) => {
    setFormOpen(false);
    setEditingData(null);
    if (refresh) {
      fetchOrcamentos();
    }
  };

  const handleEdit = (data: EditingAtividade) => {
    setEditingData(data);
    setFormOpen(true);
  };

  const handleImportComplete = () => {
    fetchOrcamentos();
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
          <p className="text-lg text-[#d6d6d6]">Você precisa estar logado para ver os orçamentos.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#8b4a12]">Orçamento</h2>
            <p className="text-[#d6d6d6]">
              Gerencie as atividades e custos do seu projeto.
            </p>
          </div>
          
          <PermissionGuard module="orcamento" action="create" obraId={selectedProjectId}>
            <div className="flex gap-2">
              <Button 
                onClick={() => setImportOpen(true)}
                variant="outline"
                className="border-[#2ecc71] text-[#2ecc71] hover:bg-[#2ecc71] hover:text-white"
              >
                <Upload className="mr-2 h-4 w-4" />
                Importar Excel
              </Button>
              <Button 
                onClick={() => { setEditingData(null); setFormOpen(true); }}
                className="bg-[#dda23a] hover:bg-[#e8b949] text-[#151f0e]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Atividade
              </Button>
            </div>
          </PermissionGuard>
        </div>

        <BudgetTable 
          orcamentos={orcamentos}
          onRefresh={fetchOrcamentos}
          isLoading={isLoading}
          onEdit={handleEdit}
        />

        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="sm:max-w-[600px] bg-[#1e2914] border-[#2f3b24]">
            <DialogHeader>
              <DialogTitle className="text-[#8b4a12]">
                {editingData ? 'Editar Atividade Orçamentária' : 'Nova Atividade Orçamentária'}
              </DialogTitle>
            </DialogHeader>
            <BudgetForm key={editingData?.id || 'new'} onClose={handleFormClose} editingData={editingData} />
          </DialogContent>
        </Dialog>

        <ExcelImportModal
          open={importOpen}
          onOpenChange={setImportOpen}
          onImportComplete={handleImportComplete}
        />
      </div>
    </AppLayout>
  );
};

export default Budget;
