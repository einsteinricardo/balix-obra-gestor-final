import React, { useState } from 'react';
import { OrcamentoWithAtividades, ATIVIDADES_PRINCIPAIS } from '@/types/budget';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { EditingAtividade } from '@/components/budget/BudgetForm';
import PermissionGuard from '@/components/rbac/PermissionGuard';

interface BudgetTableProps {
  orcamentos: OrcamentoWithAtividades[];
  onRefresh: () => void;
  isLoading: boolean;
  onEdit: (data: EditingAtividade) => void;
}

const BudgetTable: React.FC<BudgetTableProps> = ({ orcamentos, onRefresh, isLoading, onEdit }) => {
  const [expandedOrcamentos, setExpandedOrcamentos] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedProjectId } = useProject();

  const toggleExpanded = (orcamentoId: string) => {
    const newExpanded = new Set(expandedOrcamentos);
    if (newExpanded.has(orcamentoId)) {
      newExpanded.delete(orcamentoId);
    } else {
      newExpanded.add(orcamentoId);
    }
    setExpandedOrcamentos(newExpanded);
  };

  const handleDeleteAtividade = async (atividadeId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('orcamento_atividades').delete().eq('id', atividadeId);
      if (error) throw error;
      toast({ title: 'Atividade excluída', description: 'A atividade foi excluída com sucesso.' });
      onRefresh();
    } catch (error: any) {
      toast({ title: 'Erro ao excluir atividade', description: error.message, variant: 'destructive' });
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const getActivityNumber = (atividadePrincipal: string): number => ATIVIDADES_PRINCIPAIS.indexOf(atividadePrincipal as any) + 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#dda23a] mx-auto"></div>
          <p className="mt-2 text-sm text-[#d6d6d6]">Carregando orçamentos...</p>
        </div>
      </div>
    );
  }

  if (orcamentos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-[#1e2914] rounded-xl p-8 max-w-md mx-auto border border-[#2f3b24]">
          <h3 className="text-lg font-medium text-white mb-2">Nenhum orçamento encontrado</h3>
          <p className="text-[#d6d6d6] mb-4">Ainda não há atividades orçamentárias cadastradas.</p>
        </div>
      </div>
    );
  }

  const groupedByPrincipal = orcamentos.reduce((acc, orcamento) => {
    orcamento.atividades.forEach(atividade => {
      if (!acc[orcamento.atividade_principal]) acc[orcamento.atividade_principal] = [];
      acc[orcamento.atividade_principal].push({ ...atividade, orcamento_id: orcamento.id });
    });
    return acc;
  }, {} as Record<string, any[]>);

  const sortedPrincipalActivities = Object.keys(groupedByPrincipal).sort((a, b) => {
    return ATIVIDADES_PRINCIPAIS.indexOf(a as any) - ATIVIDADES_PRINCIPAIS.indexOf(b as any);
  });

  return (
    <Card className="bg-[#1e2914] border-[#2f3b24] overflow-hidden">
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2f3b24]">
                <th className="text-left py-3 px-4 text-[#8b4a12] font-semibold">Atividade</th>
                <th className="text-left py-3 px-4 text-[#8b4a12] font-semibold">Unidade</th>
                <th className="text-left py-3 px-4 text-[#8b4a12] font-semibold">Quantidade</th>
                <th className="text-left py-3 px-4 text-[#8b4a12] font-semibold">Custo Material</th>
                <th className="text-left py-3 px-4 text-[#8b4a12] font-semibold">Custo Mão de Obra</th>
                <th className="text-left py-3 px-4 text-[#8b4a12] font-semibold">Custo Total</th>
                <th className="text-left py-3 px-4 text-[#8b4a12] font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedPrincipalActivities.map((atividadePrincipal) => {
                const atividades = groupedByPrincipal[atividadePrincipal];
                const activityNumber = getActivityNumber(atividadePrincipal);
                return (
                  <React.Fragment key={atividadePrincipal}>
                    <tr className="border-b border-[#2f3b24] bg-[#262d1f] cursor-pointer hover:bg-[#2f3b24] transition-colors" onClick={() => toggleExpanded(atividadePrincipal)}>
                      <td className="py-3 px-4 text-white font-bold flex items-center">
                        {expandedOrcamentos.has(atividadePrincipal) ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                        {activityNumber}. {atividadePrincipal}
                      </td>
                      <td className="py-3 px-4 text-[#d6d6d6]">-</td>
                      <td className="py-3 px-4 text-[#d6d6d6]">-</td>
                      <td className="py-3 px-4 text-[#d6d6d6]">{formatCurrency(atividades.reduce((sum: number, a: any) => sum + a.custo_material, 0))}</td>
                      <td className="py-3 px-4 text-[#d6d6d6]">{formatCurrency(atividades.reduce((sum: number, a: any) => sum + a.custo_mao_obra, 0))}</td>
                      <td className="py-3 px-4 text-[#d6d6d6] font-semibold">{formatCurrency(atividades.reduce((sum: number, a: any) => sum + a.custo_total, 0))}</td>
                      <td className="py-3 px-4">-</td>
                    </tr>
                    {expandedOrcamentos.has(atividadePrincipal) && atividades
                      .sort((a: any, b: any) => a.descricao.localeCompare(b.descricao))
                      .map((atividade: any) => (
                        <tr key={atividade.id} className="border-b border-[#2f3b24] bg-[#1e2914]">
                          <td className="py-3 px-4 pl-8 text-[#F1F1F1]">{atividade.descricao}</td>
                          <td className="py-3 px-4 text-[#d6d6d6]">{atividade.unidade}</td>
                          <td className="py-3 px-4 text-[#d6d6d6]">{atividade.quantidade}</td>
                          <td className="py-3 px-4 text-[#d6d6d6]">{formatCurrency(atividade.custo_material)}</td>
                          <td className="py-3 px-4 text-[#d6d6d6]">{formatCurrency(atividade.custo_mao_obra)}</td>
                          <td className="py-3 px-4 text-[#d6d6d6] font-semibold">{formatCurrency(atividade.custo_total)}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <PermissionGuard module="orcamento" action="update" obraId={selectedProjectId}>
                                <Button size="sm" variant="outline" className="border-[#dda23a] text-[#dda23a] hover:bg-[#dda23a] hover:text-[#151f0e]"
                                  onClick={() => {
                                    const parentOrcamento = orcamentos.find(o => o.atividades.some(a => a.id === atividade.id));
                                    onEdit({
                                      id: atividade.id, orcamento_id: atividade.orcamento_id,
                                      atividade_principal: parentOrcamento?.atividade_principal || atividadePrincipal,
                                      descricao: atividade.descricao, unidade: atividade.unidade as 'm' | 'm²' | 'm³' | 'vb',
                                      quantidade: atividade.quantidade, custo_material: atividade.custo_material, custo_mao_obra: atividade.custo_mao_obra,
                                    });
                                  }}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </PermissionGuard>
                              <PermissionGuard module="orcamento" action="delete" obraId={selectedProjectId}>
                                <Button size="sm" onClick={() => handleDeleteAtividade(atividade.id)} className="bg-[#e74c3c] hover:bg-[#c0392b] text-white">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </PermissionGuard>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};

export default BudgetTable;
