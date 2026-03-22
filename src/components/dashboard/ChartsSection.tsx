
import React from 'react';
import DoubleBarChart from '@/components/dashboard/DoubleBarChart';
import { MonthData } from '@/hooks/useAdvancedDashboardData';

interface ChartsSectionProps {
  monthlyCashFlow: MonthData[];
}

const ChartsSection: React.FC<ChartsSectionProps> = ({ monthlyCashFlow }) => {
  return (
    <DoubleBarChart 
       data={monthlyCashFlow} 
       title="Fluxo de Caixa Mensal"
    />
  );
};

export default ChartsSection;
