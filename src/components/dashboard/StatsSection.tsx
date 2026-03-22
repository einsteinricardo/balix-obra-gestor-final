
import React from 'react';
import StatCard from '@/components/dashboard/StatCard';
import { cn } from '@/lib/utils';

interface StatsSectionProps {
  projectsCount: number;
  financialTotal: {
    income: number;
    expense: number;
  };
  expectedTotalCost: number;
  userRole?: string | null;
}

const StatsSection: React.FC<StatsSectionProps> = ({ projectsCount, financialTotal, expectedTotalCost, userRole }) => {
  const isClient = userRole === 'Cliente' || userRole === 'cliente';

  return (
    <div className="mb-8">
      <div className={cn(
        "grid gap-4",
        isClient ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      )}>
        <StatCard
          title="Projetos Ativos"
          value={projectsCount}
          description="Projetos em gestão"
          icon="chart-bar"
        />
        
        {!isClient && (
          <>
            <StatCard
              title="Receitas"
              value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(financialTotal.income)}
              description="Entradas financeiras"
              icon="trending-up"
              valueClassName="text-green-500"
            />
            <StatCard
              title="Despesas"
              value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(financialTotal.expense)}
              description="Saídas financeiras"
              icon="trending-down"
              valueClassName="text-[#a2632a]"
            />
          </>
        )}

        <StatCard
          title="Valor da Obra"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(expectedTotalCost)}
          description="Total calculado no orçamento"
          icon="calendar"
          className="cursor-pointer"
          onClick={() => {
            const el = document.getElementById('shortcuts-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      </div>
    </div>
  );
};

export default StatsSection;
