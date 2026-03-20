import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProject } from '@/contexts/ProjectContext';
import PermissionGuard from '@/components/rbac/PermissionGuard';
import { useAuth } from '@/contexts/AuthContext';

interface FinancialRecord {
  id: string;
  movement_type: 'entrada' | 'saida';
  description_category: string;
  item_description: string;
  amount: number;
  transaction_date: string;
  created_at: string;
  updated_at?: string;
  location: string;
  payment_method: string;
  item_number: number;
  week_number: number;
}

interface FinancialRecordsListProps {
  userId: string;
  onEdit: (record: FinancialRecord) => void;
  onDelete: () => void;
  refreshKey: number;
}

export const FinancialRecordsList: React.FC<FinancialRecordsListProps> = ({
  userId,
  onEdit,
  onDelete,
  refreshKey,
}) => {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroAtivo, setFiltroAtivo] = useState<'tipo' | 'semana' | 'ordem'>('tipo');
  const [dataInicial, setDataInicial] = useState<string>('');
  const [dataFinal, setDataFinal] = useState<string>('');
  const { toast } = useToast();
  const { selectedProjectId } = useProject();
  const { user } = useAuth();

  useEffect(() => {
    if (selectedProjectId) fetchRecords();
  }, [userId, refreshKey, selectedProjectId]);

  const fetchRecords = async () => {
    if (!selectedProjectId) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('cash_flow_entries')
        .select('*')
        .eq('project_id', selectedProjectId)
        .order('transaction_date', { ascending: false })
        .order('week_number', { ascending: false })
        .order('item_number', { ascending: false });

      if (error) throw error;
      setRecords((data as FinancialRecord[]) || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar registros',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      const { error } = await supabase.from('cash_flow_entries').delete().eq('id', id);
      if (error) throw error;

      setRecords((current) => current.filter((record) => record.id !== id));
      onDelete();
      toast({ title: 'Registro excluído', description: 'O lançamento foi excluído com sucesso.' });
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir registro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const isCliente = user?.role === 'Cliente';
  const filtroAplicado = isCliente ? 'tipo' : filtroAtivo;

  const aplicarFiltroPeriodo = (lancamentos: FinancialRecord[]) => {
    return lancamentos.filter((l) => {
      const data = new Date(`${l.transaction_date}T12:00:00`);

      if (dataInicial) {
        const dInicial = new Date(`${dataInicial}T00:00:00`);
        if (data < dInicial) return false;
      }
      if (dataFinal) {
        const dFinal = new Date(`${dataFinal}T23:59:59`);
        if (data > dFinal) return false;
      }
      return true;
    });
  };

  const dadosBase = isCliente ? records : aplicarFiltroPeriodo(records);

  const entries = useMemo(
    () => dadosBase.filter((record) => record.movement_type === 'entrada'),
    [dadosBase]
  );
  const expenses = useMemo(
    () => dadosBase.filter((record) => record.movement_type === 'saida'),
    [dadosBase]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Carregando registros...</p>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-secondary/30 p-8">
          <h3 className="mb-2 text-lg font-medium text-foreground">Nenhum registro encontrado</h3>
          <p className="text-muted-foreground">Ainda não há movimentações financeiras para esta obra.</p>
        </div>
      </div>
    );
  }

  const renderRecord = (record: FinancialRecord) => {
    const isEntrada = record.movement_type === 'entrada';
    const accentClass = isEntrada ? 'text-primary' : 'text-destructive';
    const badgeClass = isEntrada
      ? 'bg-primary/10 text-primary'
      : 'bg-destructive/10 text-destructive';

    return (
      <div key={record.id} className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`font-semibold ${accentClass}`}>{record.item_description}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass}`}>
                {record.description_category}
              </span>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                Semana {String(record.week_number).padStart(2, '0')} · Item {record.item_number}
              </span>
            </div>

            <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
              <span>
                <strong className="text-foreground">Valor:</strong>{' '}
                R$ {Number(record.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span>
                <strong className="text-foreground">Data:</strong>{' '}
                {format(new Date(`${record.transaction_date}T12:00:00`), 'dd/MM/yyyy', {
                  locale: ptBR,
                })}
              </span>
              <span>
                <strong className="text-foreground">Local:</strong> {record.location}
              </span>
              <span>
                <strong className="text-foreground">Pagamento:</strong> {record.payment_method}
              </span>
            </div>
          </div>

          <div className="flex gap-2 self-start">
            <PermissionGuard module="financeiro" action="update" obraId={selectedProjectId}>
              <Button size="sm" variant="outline" onClick={() => onEdit(record)} className="h-8 px-3">
                <Edit className="mr-1 h-3 w-3" />
                Editar
              </Button>
            </PermissionGuard>
            <PermissionGuard module="financeiro" action="delete" obraId={selectedProjectId}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteRecord(record.id)}
                className="h-8 px-3 text-destructive"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Excluir
              </Button>
            </PermissionGuard>
          </div>
        </div>
      </div>
    );
  };

  const renderEntradasSaidas = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-primary">
          <TrendingUp className="h-5 w-5" />
          Entradas ({entries.length})
        </h3>
        {entries.length > 0 ? (
          <div className="space-y-3">{entries.map(renderRecord)}</div>
        ) : (
          <p className="rounded-lg bg-secondary/30 p-4 text-sm text-muted-foreground">
            Nenhuma entrada registrada ainda.
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-destructive">
          <TrendingDown className="h-5 w-5" />
          Saídas ({expenses.length})
        </h3>
        {expenses.length > 0 ? (
          <div className="space-y-3">{expenses.map(renderRecord)}</div>
        ) : (
          <p className="rounded-lg bg-secondary/30 p-4 text-sm text-muted-foreground">
            Nenhuma saída registrada ainda.
          </p>
        )}
      </div>
    </div>
  );

  const renderPorSemana = () => {
    const groupedByWeek = dadosBase.reduce((acc, record) => {
      const week = record.week_number || 0;
      if (!acc[week]) acc[week] = [];
      acc[week].push(record);
      return acc;
    }, {} as Record<number, FinancialRecord[]>);

    return (
      <div className="space-y-8">
        {Object.keys(groupedByWeek)
          .sort((a, b) => Number(b) - Number(a))
          .map((weekStr) => {
            const week = Number(weekStr);
            const items = groupedByWeek[week];
            return (
              <div key={week} className="rounded-lg border border-border/60 bg-card p-5">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground border-b pb-2">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-md text-sm">Semana {String(week).padStart(2, '0')}</span>
                  <span className="text-muted-foreground text-sm font-normal">({items.length} lançamentos)</span>
                </h3>
                <div className="space-y-3">
                  {items.map(renderRecord)}
                </div>
              </div>
            );
          })}
      </div>
    );
  };

  const renderOrdenado = () => {
    const ordenados = [...dadosBase].sort(
      (a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
    );

    return (
      <div className="space-y-3">
        {ordenados.map(renderRecord)}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filtro Navigation Header & Date Filters */}
      {!isCliente && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2 p-1 bg-secondary/40 border border-border rounded-lg w-full sm:w-fit">
            <button
              onClick={() => setFiltroAtivo('tipo')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filtroAplicado === 'tipo' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-black/5'}`}
            >
              Entradas e Saídas
            </button>
            <button
              onClick={() => setFiltroAtivo('semana')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filtroAplicado === 'semana' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-black/5'}`}
            >
              Semanas
            </button>
            <button
              onClick={() => setFiltroAtivo('ordem')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filtroAplicado === 'ordem' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-black/5'}`}
            >
              Ordem de Lançamentos
            </button>
          </div>

          {/* Filtro de Período */}
          <div className="flex flex-wrap items-center gap-3 bg-card p-3 rounded-lg border border-border shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Período:</span>
              <input
                type="date"
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
                className="flex h-9 w-[130px] sm:w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              <span className="text-muted-foreground text-sm">até</span>
              <input
                type="date"
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
                className="flex h-9 w-[130px] sm:w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            {(dataInicial || dataFinal) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setDataInicial(''); setDataFinal(''); }}
                className="text-balix-accent hover:text-balix-accent/80 hover:bg-balix-accent/10 h-9"
              >
                Limpar filtro
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Render based on Filter */}
      {filtroAplicado === 'tipo' && renderEntradasSaidas()}
      {filtroAplicado === 'semana' && renderPorSemana()}
      {filtroAplicado === 'ordem' && renderOrdenado()}
    </div>
  );
};
