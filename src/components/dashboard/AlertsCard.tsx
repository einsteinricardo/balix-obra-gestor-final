import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Clock, FileWarning } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Alert {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'info' | 'error';
  date: string;
}

interface AlertsCardProps {
  alerts: Alert[];
}

const defaultAlerts: Alert[] = [
  {
    id: '1',
    title: 'Documento pendente',
    description: 'Licença ambiental com prazo de 7 dias para vencimento',
    type: 'warning',
    date: '22/05/2025'
  },
  {
    id: '2',
    title: 'Cronograma desatualizado',
    description: 'A etapa "Fundação" está atrasada em 3 dias',
    type: 'error',
    date: '21/05/2025'
  },
  {
    id: '3',
    title: 'Visita técnica agendada',
    description: 'Engenheiro fiscal confirmou visita para amanhã às 10h',
    type: 'info',
    date: '20/05/2025'
  }
];

const AlertsCard: React.FC<AlertsCardProps> = ({ alerts = defaultAlerts }) => {
  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return <Bell className="h-4 w-4 text-yellow-400" />;
      case 'info':
        return <Clock className="h-4 w-4 text-blue-400" />;
      case 'error':
        return <FileWarning className="h-4 w-4 text-red-400" />;
      default:
        return <Bell className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getAlertClass = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return 'border-l-4 border-yellow-400';
      case 'info':
        return 'border-l-4 border-blue-400';
      case 'error':
        return 'border-l-4 border-red-400';
      default:
        return '';
    }
  };

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle className="text-lg font-playfair">Alertas & Notificações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className={cn('p-3 bg-secondary/50 rounded-md', getAlertClass(alert.type))}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium">{alert.title}</h4>
                <p className="text-xs text-muted-foreground">{alert.description}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-muted-foreground">{alert.date}</span>
                  <button className="text-xs text-balix-accent hover:underline">
                    Visualizar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AlertsCard;
