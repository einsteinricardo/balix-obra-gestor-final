import React, { useState } from 'react';
import { AtividadeWithExecucoes, OrcamentoWithAtividades, ATIVIDADES_PRINCIPAIS } from '@/types/budget';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ScheduleFinancialTableProps {
  orcamentos: OrcamentoWithAtividades[];
  atividades: AtividadeWithExecucoes[];
  weeks: Date[];
  onRefresh: () => void;
  isLoading: boolean;
}

const ScheduleFinancialTable: React.FC<ScheduleFinancialTableProps> = ({ 
  orcamentos, 
  atividades,
  weeks, 
  onRefresh, 
  isLoading 
}) => {
  const [expandedOrcamentos, setExpandedOrcamentos] = useState<Set<string>>(new Set());
  const [percentualInputs, setPercentualInputs] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const { user } = useAuth();

  const toggleExpanded = (orcamentoId: string) => {
    const newExpanded = new Set(expandedOrcamentos);
    if (newExpanded.has(orcamentoId)) {
      newExpanded.delete(orcamentoId);
    } else {
      newExpanded.add(orcamentoId);
    }
    setExpandedOrcamentos(newExpanded);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getActivityNumber = (atividadePrincipal: string): number => {
    return ATIVIDADES_PRINCIPAIS.indexOf(atividadePrincipal as any) + 1;
  };

  const getExecucaoForWeek = (atividadeId: string, weekStart: Date) => {
    const atividade = atividades.find(a => a.id === atividadeId);
    if (!atividade) return null;
    
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    return atividade.execucoes.find(e => e.data_inicio_semana === weekStartStr);
  };

  const handlePercentualChange = (atividadeId: string, weekStart: Date, percentual: number) => {
    const key = `${atividadeId}-${format(weekStart, 'yyyy-MM-dd')}`;
    setPercentualInputs(prev => ({
      ...prev,
      [key]: percentual
    }));
  };

  const saveExecucao = async (atividadeId: string, weekStart: Date, percentual: number) => {
    if (!user) return;
    
    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const atividade = atividades.find(a => a.id === atividadeId);
      
      if (!atividade) return;
      
      const valorExecutado = (percentual / 100) * atividade.custo_total;
      
      const existingExecucao = getExecucaoForWeek(atividadeId, weekStart);
      
      if (existingExecucao) {
        // Atualizar execução existente
        const { error } = await supabase
          .from('cronograma_execucoes')
          .update({
            percentual_executado: percentual,
            valor_executado: valorExecutado
          })
          .eq('id', existingExecucao.id);
        
        if (error) throw error;
      } else {
        // Criar nova execução
        const { error } = await supabase
          .from('cronograma_execucoes')
          .insert({
            atividade_id: atividadeId,
            data_inicio_semana: weekStartStr,
            percentual_executado: percentual,
            valor_executado: valorExecutado
          });
        
        if (error) throw error;
      }
      
      toast({
        title: 'Progresso salvo',
        description: 'O progresso da atividade foi salvo com sucesso.',
      });
      
      onRefresh();
    } catch (error: any) {
      console.error('Error saving execution:', error);
      toast({
        title: 'Erro ao salvar progresso',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getTotalExecutedPercentage = (atividadeId: string) => {
    const atividade = atividades.find(a => a.id === atividadeId);
    if (!atividade) return 0;
    
    return atividade.execucoes.reduce((total, exec) => total + exec.percentual_executado, 0);
  };

  const getTotalExecutedValue = (atividadeId: string) => {
    const atividade = atividades.find(a => a.id === atividadeId);
    if (!atividade) return 0;
    
    return atividade.execucoes.reduce((total, exec) => total + exec.valor_executado, 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#dda23a] mx-auto"></div>
          <p className="mt-2 text-sm text-[#d6d6d6]">Carregando cronograma...</p>
        </div>
      </div>
    );
  }

  if (orcamentos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-[#1e2914] rounded-xl p-8 max-w-md mx-auto border border-[#2f3b24]">
          <h3 className="text-lg font-medium text-white mb-2">
            Nenhum orçamento encontrado
          </h3>
          <p className="text-[#d6d6d6] mb-4">
            Você precisa ter atividades orçamentárias cadastradas para visualizar o cronograma.
          </p>
          <p className="text-sm text-[#d6d6d6]">
            Acesse a seção "Orçamento" para cadastrar suas atividades.
          </p>
        </div>
      </div>
    );
  }

  // Agrupar atividades por atividade principal e ordenar
  const groupedByPrincipal = orcamentos.reduce((acc, orcamento) => {
    if (orcamento.atividades.length > 0) {
      acc[orcamento.atividade_principal] = orcamento.atividades;
    }
    return acc;
  }, {} as Record<string, any[]>);

  // Ordenar as atividades principais conforme ATIVIDADES_PRINCIPAIS
  const sortedPrincipalActivities = Object.keys(groupedByPrincipal).sort((a, b) => {
    const indexA = ATIVIDADES_PRINCIPAIS.indexOf(a as any);
    const indexB = ATIVIDADES_PRINCIPAIS.indexOf(b as any);
    return indexA - indexB;
  });

  return (
    <Card className="bg-[#1e2914] border-[#2f3b24] overflow-hidden">
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="border-b border-[#2f3b24]">
                <th className="text-left py-3 px-4 text-[#8b4a12] font-semibold min-w-[200px]">Etapa Principal</th>
                <th className="text-left py-3 px-4 text-[#8b4a12] font-semibold">Unidade</th>
                <th className="text-left py-3 px-4 text-[#8b4a12] font-semibold">Qtd Total</th>
                {weeks.map((week, index) => (
                  <th key={index} className="text-center py-3 px-2 text-[#8b4a12] font-semibold min-w-[100px]">
                    Semana {index + 1}<br />
                    <span className="text-xs text-[#d6d6d6]">
                      {format(week, 'dd/MM', { locale: ptBR })}
                    </span>
                  </th>
                ))}
                <th className="text-left py-3 px-4 text-[#8b4a12] font-semibold">Total Executado</th>
                <th className="text-left py-3 px-4 text-[#8b4a12] font-semibold">% Concluído</th>
              </tr>
            </thead>
            <tbody>
              {sortedPrincipalActivities.map((atividadePrincipal) => {
                const atividadesGrupo = groupedByPrincipal[atividadePrincipal];
                const activityNumber = getActivityNumber(atividadePrincipal);
                
                return (
                  <React.Fragment key={atividadePrincipal}>
                    <tr 
                      className="border-b border-[#2f3b24] bg-[#262d1f] cursor-pointer hover:bg-[#2f3b24] transition-colors"
                      onClick={() => toggleExpanded(atividadePrincipal)}
                    >
                      <td className="py-3 px-4 text-white font-bold flex items-center">
                        {expandedOrcamentos.has(atividadePrincipal) ? (
                          <ChevronDown className="h-4 w-4 mr-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-2" />
                        )}
                        {activityNumber}. {atividadePrincipal}
                      </td>
                      <td className="py-3 px-4 text-[#d6d6d6]">-</td>
                      <td className="py-3 px-4 text-[#d6d6d6]">-</td>
                      {weeks.map((_, index) => (
                        <td key={index} className="py-3 px-2 text-center text-[#d6d6d6]">-</td>
                      ))}
                      <td className="py-3 px-4 text-[#d6d6d6]">
                        {formatCurrency(atividadesGrupo.reduce((sum, a) => sum + getTotalExecutedValue(a.id), 0))}
                      </td>
                      <td className="py-3 px-4 text-[#d6d6d6]">
                        {((atividadesGrupo.reduce((sum, a) => sum + getTotalExecutedPercentage(a.id), 0) / atividadesGrupo.length) || 0).toFixed(1)}%
                      </td>
                    </tr>
                    
                    {expandedOrcamentos.has(atividadePrincipal) && atividadesGrupo
                      .sort((a, b) => a.descricao.localeCompare(b.descricao))
                      .map((atividade) => {
                        const totalPercentage = getTotalExecutedPercentage(atividade.id);
                        const totalValue = getTotalExecutedValue(atividade.id);
                        const isOverLimit = totalPercentage > 100;
                        
                        return (
                          <tr key={atividade.id} className="border-b border-[#2f3b24] bg-[#1e2914]">
                            <td className="py-3 px-4 pl-8 text-[#F1F1F1]">{atividade.descricao}</td>
                            <td className="py-3 px-4 text-[#d6d6d6]">{atividade.unidade}</td>
                            <td className="py-3 px-4 text-[#d6d6d6]">{atividade.quantidade}</td>
                            {weeks.map((week, weekIndex) => {
                              const execucao = getExecucaoForWeek(atividade.id, week);
                              const key = `${atividade.id}-${format(week, 'yyyy-MM-dd')}`;
                              
                              return (
                                <td key={weekIndex} className="py-3 px-2">
                                  <div className="flex flex-col gap-1">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.1"
                                      value={percentualInputs[key] ?? execucao?.percentual_executado ?? ''}
                                      onChange={(e) => handlePercentualChange(atividade.id, week, parseFloat(e.target.value) || 0)}
                                      onBlur={(e) => {
                                        const percentual = parseFloat(e.target.value) || 0;
                                        if (percentual !== (execucao?.percentual_executado ?? 0)) {
                                          saveExecucao(atividade.id, week, percentual);
                                        }
                                      }}
                                      className="w-full text-xs bg-[#262d1f] border-[#7b420e] text-white text-center"
                                      placeholder="%"
                                    />
                                    <div className="text-xs text-[#d6d6d6] text-center">
                                      {formatCurrency(((percentualInputs[key] ?? execucao?.percentual_executado ?? 0) / 100) * atividade.custo_total)}
                                    </div>
                                  </div>
                                </td>
                              );
                            })}
                            <td className="py-3 px-4 text-[#d6d6d6]">{formatCurrency(totalValue)}</td>
                            <td className={`py-3 px-4 font-semibold ${isOverLimit ? 'text-red-500' : 'text-[#2ecc71]'}`}>
                              {totalPercentage.toFixed(1)}%
                              {isOverLimit && (
                                <div className="text-xs text-red-400">Limite excedido!</div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Resumo */}
        <div className="mt-6 bg-[#262d1f] rounded-lg p-4 border border-[#2f3b24]">
          <h3 className="text-[#8b4a12] font-semibold mb-3">Resumo da Obra</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-[#d6d6d6]">Valor Total Executado</div>
              <div className="text-lg font-semibold text-white">
                {formatCurrency(atividades.reduce((total, a) => total + getTotalExecutedValue(a.id), 0))}
              </div>
            </div>
            <div>
              <div className="text-sm text-[#d6d6d6]">Valor Total Orçado</div>
              <div className="text-lg font-semibold text-white">
                {formatCurrency(atividades.reduce((total, a) => total + a.custo_total, 0))}
              </div>
            </div>
            <div>
              <div className="text-sm text-[#d6d6d6]">Percentual Médio Executado</div>
              <div className="text-lg font-semibold text-[#2ecc71]">
                {atividades.length > 0 
                  ? (atividades.reduce((total, a) => total + getTotalExecutedPercentage(a.id), 0) / atividades.length).toFixed(1) 
                  : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ScheduleFinancialTable;
