import React from 'react';
import { WorkDiaryEntry } from '@/types/progress';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, Cloud, Sun, CloudRain, CloudDrizzle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface WorkDiaryListProps {
  entries: WorkDiaryEntry[];
  onEdit: (entry: WorkDiaryEntry) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

const WorkDiaryList: React.FC<WorkDiaryListProps> = ({ entries, onEdit, onDelete, isLoading }) => {
  const getWeatherIcon = (weather?: string) => {
    switch (weather) {
      case 'sunny':
        return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'cloudy':
        return <Cloud className="h-4 w-4 text-gray-500" />;
      case 'rainy':
        return <CloudRain className="h-4 w-4 text-blue-500" />;
      case 'partly_cloudy':
        return <CloudDrizzle className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getWeatherLabel = (weather?: string): string => {
    const weatherMap: Record<string, string> = {
      'sunny': 'Ensolarado',
      'cloudy': 'Nublado',
      'rainy': 'Chuvoso',
      'partly_cloudy': 'Parcialmente nublado'
    };
    
    return weather ? weatherMap[weather] || weather : 'Não informado';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-balix-accent mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Carregando entradas do diário...</p>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma entrada encontrada
          </h3>
          <p className="text-muted-foreground mb-4">
            Ainda não há entradas no diário de obras para este projeto.
          </p>
          <p className="text-sm text-muted-foreground">
            Clique em "Nova Entrada" para adicionar a primeira entrada.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <Card key={entry.id} className="p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-lg font-medium text-gray-900">
                  {format(new Date(entry.date), 'dd/MM/yyyy')}
                </span>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  {getWeatherIcon(entry.weather)}
                  <span>{getWeatherLabel(entry.weather)}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Responsável: {entry.responsible}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onEdit(entry)}
                className="h-8 px-3"
              >
                <Edit className="h-3 w-3 mr-1" />
                Editar
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onDelete(entry.id)}
                className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Excluir
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Descrição das Atividades</h4>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {entry.description}
              </p>
            </div>
            
            {entry.image_url && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-600">Registro Fotográfico</h5>
                <div className="flex items-center gap-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8">
                        <Eye className="h-3 w-3 mr-1" />
                        Visualizar Foto
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>
                          Diário de Obras - {format(new Date(entry.date), 'dd/MM/yyyy')}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="flex justify-center">
                        <img
                          src={entry.image_url}
                          alt={`Registro do dia ${format(new Date(entry.date), 'dd/MM/yyyy')}`}
                          className="max-h-96 w-auto object-contain rounded-lg"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                  <a 
                    href={entry.image_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-balix-accent hover:text-balix-accent/80 underline"
                  >
                    Abrir em nova aba
                  </a>
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default WorkDiaryList;
