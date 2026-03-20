
import React from 'react';
import AlertsCard from '@/components/dashboard/AlertsCard';

const AlertsSection: React.FC = () => {
  // Sample alerts data with properly typed alert types
  const alertsData = [
    {
      id: '1',
      title: 'Documento pendente',
      description: 'Licença ambiental com prazo de 7 dias para vencimento',
      type: 'warning' as const,
      date: '22/05/2025'
    },
    {
      id: '2',
      title: 'Cronograma desatualizado',
      description: 'A etapa "Fundação" está atrasada em 3 dias',
      type: 'error' as const,
      date: '21/05/2025'
    },
    {
      id: '3',
      title: 'Visita técnica agendada',
      description: 'Engenheiro fiscal confirmou visita para amanhã às 10h',
      type: 'info' as const,
      date: '20/05/2025'
    }
  ];

  return (
    <div className="mb-6">
      <AlertsCard alerts={alertsData} />
    </div>
  );
};

export default AlertsSection;
