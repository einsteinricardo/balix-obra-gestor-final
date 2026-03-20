
import React from 'react';
import StatCard from '@/components/dashboard/StatCard';

interface StatsSectionProps {
  projectsCount: number;
  financialTotal: {
    income: number;
    expense: number;
  };
}

const StatsSection: React.FC<StatsSectionProps> = ({ projectsCount, financialTotal }) => {
  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Projetos Ativos"
          value={projectsCount}
          description="Total de projetos gerenciados"
          icon="chart-bar"
        />
        <StatCard
          title="Receitas"
          value={`R$ ${(financialTotal.income / 1000).toFixed(0)}k`}
          description="Total de entradas financeiras"
          icon="trending-up"
          valueClassName="text-green-500"
        />
        <StatCard
          title="Despesas"
          value={`R$ ${(financialTotal.expense / 1000).toFixed(0)}k`}
          description="Total de saídas financeiras"
          icon="trending-down"
          valueClassName="text-red-500"
        />
      </div>
    </div>
  );
};

export default StatsSection;
