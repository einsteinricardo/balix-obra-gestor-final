import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, TrendingDown, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FinancialRecordsList } from '@/components/financial/FinancialRecordsList';
import { FinancialForm } from '@/components/financial/FinancialForm';
import { FinancialCharts } from '@/components/financial/FinancialCharts';
import { AdministrationTab } from '@/components/financial/AdministrationTab';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import PermissionGuard from '@/components/rbac/PermissionGuard';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const ProjectFinancials = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [financialSummary, setFinancialSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });
  const { selectedProjectId, currentRole, isAdmin } = useProject();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [abaSelecionada, setAbaSelecionada] = useState<string>("transactions");

  const podeVerAdministracao = 
    isAdmin || 
    ['Administrador', 'Proprietário', 'Gestor da Obra', 'Financeiro'].includes(currentRole?.role_nome || '');

  useEffect(() => {
    const abaParam = searchParams.get('aba');
    if (abaParam === 'administracao' && podeVerAdministracao) {
      setAbaSelecionada('administracao');
    }
  }, [searchParams, podeVerAdministracao]);

  useEffect(() => {
    if (user && selectedProjectId) {
      fetchFinancialSummary();
    }
  }, [user, selectedProjectId, refreshKey]);


  const fetchFinancialSummary = async () => {
    if (!selectedProjectId) return;

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('cash_flow_entries')
        .select('movement_type, amount')
        .eq('project_id', selectedProjectId);

      if (error) throw error;

      const totalIncome = (data || [])
        .filter((record) => record.movement_type === 'entrada')
        .reduce((sum, record) => sum + Number(record.amount), 0);
      const totalExpense = (data || [])
        .filter((record) => record.movement_type === 'saida')
        .reduce((sum, record) => sum + Number(record.amount), 0);

      setFinancialSummary({
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      });
    } catch (error: any) {
      console.error('Error fetching financial summary:', error);
      toast({
        title: 'Erro ao carregar resumo financeiro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRecord = () => {
    setEditingRecord(null);
    setIsFormOpen(true);
  };

  const handleEditRecord = (record: any) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const handleFormClose = (refresh = false) => {
    setIsFormOpen(false);
    setEditingRecord(null);

    if (refresh) {
      setRefreshKey((prev) => prev + 1);
      toast({ title: 'Sucesso', description: 'Movimentação financeira salva com sucesso.' });
    }
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    toast({ title: 'Dados atualizados', description: 'Os dados financeiros foram atualizados.' });
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Controle Financeiro</h2>
            <p className="mt-1 text-muted-foreground">
              Gerencie todas as movimentações financeiras da sua obra.
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <PermissionGuard module="financeiro" action="create" obraId={selectedProjectId}>
              <Button onClick={handleAddRecord} disabled={isLoading}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Movimentação
              </Button>
            </PermissionGuard>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Entradas</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {currencyFormatter.format(financialSummary.totalIncome)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Saídas</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {currencyFormatter.format(financialSummary.totalExpense)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Atual</CardTitle>
              <DollarSign className="h-4 w-4 text-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  financialSummary.balance >= 0 ? 'text-primary' : 'text-destructive'
                }`}
              >
                {currencyFormatter.format(financialSummary.balance)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={abaSelecionada} onValueChange={setAbaSelecionada} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="transactions">Lista de Movimentações</TabsTrigger>
            <TabsTrigger value="charts">Gráficos</TabsTrigger>
            {podeVerAdministracao && <TabsTrigger value="administration">Administração</TabsTrigger>}
          </TabsList>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Movimentações Financeiras</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {user && (
                  <FinancialRecordsList
                    userId={user.id}
                    onEdit={handleEditRecord}
                    onDelete={() => setRefreshKey((prev) => prev + 1)}
                    refreshKey={refreshKey}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charts">
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Análise Visual</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {user && <FinancialCharts userId={user.id} refreshKey={refreshKey} />}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="administration">
            {selectedProjectId && (
              podeVerAdministracao ? (
                <AdministrationTab 
                  projectId={selectedProjectId} 
                  userRole={currentRole?.role_nome} 
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-white/20">
                  <AlertCircle className="h-10 w-10 mb-2 opacity-50" />
                  <p>Acesso restrito. Esta área é exclusiva para Administração, Gestão e Financeiro.</p>
                </div>
              )
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="overflow-hidden border-border bg-card/95 p-0 shadow-2xl backdrop-blur-xl sm:max-w-4xl">
            <DialogHeader className="border-b border-border bg-secondary/40 px-6 py-5">
              <DialogTitle className="text-xl text-foreground">
                {editingRecord ? 'Editar Movimentação Financeira' : 'Nova Movimentação Financeira'}
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 py-6">
              {user && <FinancialForm userId={user.id} record={editingRecord} onClose={handleFormClose} />}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default ProjectFinancials;
