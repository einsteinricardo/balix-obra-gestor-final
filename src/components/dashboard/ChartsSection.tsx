
import React from 'react';
import LineChart from '@/components/dashboard/LineChart';
import ProgressChart from '@/components/dashboard/ProgressChart';

const ChartsSection: React.FC = () => {
  // Sample chart data
  const progressChartData = [
    { name: 'Jan', previsto: 65, realizado: 40 },
    { name: 'Fev', previsto: 50, realizado: 30 },
    { name: 'Mar', previsto: 75, realizado: 60 },
    { name: 'Abr', previsto: 90, realizado: 70 },
    { name: 'Mai', previsto: 100, realizado: 80 },
  ];
  
  const lineChartData = [
    { name: 'Jan', previsto: 40, realizado: 24 },
    { name: 'Fev', previsto: 30, realizado: 13 },
    { name: 'Mar', previsto: 20, realizado: 98 },
    { name: 'Abr', previsto: 27, realizado: 39 },
    { name: 'Mai', previsto: 18, realizado: 48 },
    { name: 'Jun', previsto: 23, realizado: 38 },
    { name: 'Jul', previsto: 34, realizado: 43 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="lg:col-span-2">
        <LineChart 
          data={lineChartData} 
          title="Análise Financeira"
        />
      </div>
      <div>
        <ProgressChart 
          data={progressChartData}
          title="Progresso da Obra (%)"
        />
      </div>
    </div>
  );
};

export default ChartsSection;
