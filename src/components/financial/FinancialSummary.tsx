
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FinancialSummaryProps {
  projectId: string;
  refreshKey: number;
}

type FinancialRecordType = 'income' | 'expense';

interface SummaryData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  recentTransactions: {
    id: string;
    type: FinancialRecordType;
    amount: number;
    description: string;
    date: string;
  }[];
  monthlyStats: {
    month: string;
    totalIncome: number;
    totalExpense: number;
  }[];
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({ projectId, refreshKey }) => {
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    recentTransactions: [],
    monthlyStats: [],
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        setLoading(true);
        
        // Fetch all financial records for the project
        const { data, error } = await supabase
          .from('financial_records')
          .select('*')
          .eq('project_id', projectId)
          .order('date', { ascending: false });
          
        if (error) throw error;
        
        if (data) {
          // Calculate total income and expense
          let totalIncome = 0;
          let totalExpense = 0;
          
          data.forEach((record) => {
            if (record.type === 'income') {
              totalIncome += Number(record.amount);
            } else {
              totalExpense += Number(record.amount);
            }
          });
          
          // Calculate balance
          const balance = totalIncome - totalExpense;
          
          // Get recent transactions (last 5)
          const recentTransactions = data.slice(0, 5).map(record => ({
            id: record.id,
            type: record.type as FinancialRecordType,
            amount: Number(record.amount),
            description: record.description,
            date: record.date,
          }));
          
          // Calculate monthly statistics
          const months: Record<string, { totalIncome: number; totalExpense: number }> = {};
          
          data.forEach(record => {
            const date = new Date(record.date);
            const monthYear = format(date, 'MM/yyyy');
            
            if (!months[monthYear]) {
              months[monthYear] = { totalIncome: 0, totalExpense: 0 };
            }
            
            if (record.type === 'income') {
              months[monthYear].totalIncome += Number(record.amount);
            } else {
              months[monthYear].totalExpense += Number(record.amount);
            }
          });
          
          const monthlyStats = Object.entries(months)
            .map(([month, stats]) => ({
              month,
              ...stats,
            }))
            .sort((a, b) => {
              const [aMonth, aYear] = a.month.split('/');
              const [bMonth, bYear] = b.month.split('/');
              
              // Fix: Convert string to number for comparison
              const aDate = new Date(Number(aYear), Number(aMonth) - 1);
              const bDate = new Date(Number(bYear), Number(bMonth) - 1);
              
              return bDate.getTime() - aDate.getTime();
            })
            .slice(0, 6); // Get last 6 months
          
          setSummaryData({
            totalIncome,
            totalExpense,
            balance,
            recentTransactions,
            monthlyStats,
          });
        }
      } catch (error: any) {
        console.error('Error fetching financial summary:', error);
        toast({
          title: 'Erro ao carregar resumo financeiro',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, [projectId, refreshKey, toast]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-balix-accent"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Entradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
            <div className="text-2xl font-bold">
              {formatCurrency(summaryData.totalIncome)}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Saídas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <TrendingDown className="h-5 w-5 mr-2 text-red-500" />
            <div className="text-2xl font-bold">
              {formatCurrency(summaryData.totalExpense)}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Saldo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <Wallet className="h-5 w-5 mr-2 text-blue-500" />
            <div className={`text-2xl font-bold ${
              summaryData.balance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(summaryData.balance)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {summaryData.recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {summaryData.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    {transaction.type === 'income' ? (
                      <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-2 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{transaction.description}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className={`font-medium ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">Nenhuma transação recente.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estatísticas Mensais</CardTitle>
        </CardHeader>
        <CardContent>
          {summaryData.monthlyStats.length > 0 ? (
            <div className="space-y-4">
              {summaryData.monthlyStats.map((stats, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <p className="text-sm font-medium">{stats.month}</p>
                  </div>
                  <div className="flex justify-between text-xs">
                    <div>
                      <p className="text-gray-500">Entradas</p>
                      <p className="text-green-600 font-medium">{formatCurrency(stats.totalIncome)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Saídas</p>
                      <p className="text-red-600 font-medium">{formatCurrency(stats.totalExpense)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Saldo</p>
                      <p className={`font-medium ${
                        stats.totalIncome - stats.totalExpense >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(stats.totalIncome - stats.totalExpense)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">Nenhum dado mensal disponível.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
