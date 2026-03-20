import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProject } from '@/contexts/ProjectContext';

interface FinancialChartsProps {
  userId: string;
  refreshKey: number;
}

type CashFlowEntry = {
  amount: number;
  description_category: string;
  movement_type: 'entrada' | 'saida';
  transaction_date: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  'Pagamento do cliente': 'Pagamento do cliente',
  Investimento: 'Investimento',
  'Receita adicional': 'Receita adicional',
  Materiais: 'Materiais',
  'Mão de Obra': 'Mão de Obra',
  Equipamentos: 'Equipamentos',
  Serviços: 'Serviços',
  'Licenças e Taxas': 'Licenças e Taxas',
  Outros: 'Outros',
};

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--secondary-foreground))',
  'hsl(var(--muted-foreground))',
  'hsl(var(--destructive))',
  'hsl(var(--ring))',
];

export const FinancialCharts: React.FC<FinancialChartsProps> = ({ userId, refreshKey }) => {
  const [expensesByCategory, setExpensesByCategory] = useState<{ name: string; value: number }[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedProjectId } = useProject();

  useEffect(() => {
    if (selectedProjectId) fetchChartData();
  }, [userId, refreshKey, selectedProjectId]);

  const fetchChartData = async () => {
    if (!selectedProjectId) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('cash_flow_entries')
        .select('amount, description_category, movement_type, transaction_date')
        .eq('project_id', selectedProjectId);

      if (error) throw error;

      const entries = (data as CashFlowEntry[]) || [];

      const expenseData = entries
        .filter((record) => record.movement_type === 'saida')
        .reduce((acc, record) => {
          acc[record.description_category] =
            (acc[record.description_category] || 0) + Number(record.amount);
          return acc;
        }, {} as Record<string, number>);

      setExpensesByCategory(
        Object.entries(expenseData).map(([category, amount]) => ({
          name: CATEGORY_LABELS[category] || category,
          value: amount,
        }))
      );

      const monthlyTotals = entries.reduce((acc, record) => {
        const month = new Date(`${record.transaction_date}T12:00:00`).toLocaleDateString('pt-BR', {
          month: 'short',
          year: 'numeric',
        });

        if (!acc[month]) acc[month] = { month, entradas: 0, saidas: 0 };

        if (record.movement_type === 'entrada') acc[month].entradas += Number(record.amount);
        else acc[month].saidas += Number(record.amount);

        return acc;
      }, {} as Record<string, { month: string; entradas: number; saidas: number }>);

      setMonthlyData(Object.values(monthlyTotals));
    } catch (error: any) {
      console.error('Error fetching chart data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Gastos por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          {expensesByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {expensesByCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-8 text-center text-muted-foreground">Nenhum dado de gastos disponível</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Entradas vs Saídas por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} />
                <Legend />
                <Bar dataKey="entradas" fill="hsl(var(--primary))" name="Entradas" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" fill="hsl(var(--destructive))" name="Saídas" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-8 text-center text-muted-foreground">Nenhum dado mensal disponível</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
