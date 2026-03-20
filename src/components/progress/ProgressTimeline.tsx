
import React from 'react';
import { ProgressRecord } from '@/types/progress';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Edit, Trash2, Image, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ProgressTimelineProps {
  records: ProgressRecord[];
  onEdit: (record: ProgressRecord) => void;
  onDelete: (id: string) => void;
}

const ProgressTimeline: React.FC<ProgressTimelineProps> = ({ records, onEdit, onDelete }) => {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const getStageLabel = (stage: string): string => {
    const stageMap: Record<string, string> = {
      'foundation': 'Fundação',
      'structure': 'Estrutura',
      'masonry': 'Alvenaria',
      'roofing': 'Cobertura',
      'electrical': 'Elétrica',
      'plumbing': 'Hidráulica',
      'finishing': 'Acabamento',
      'landscaping': 'Paisagismo',
      'other': 'Outro'
    };
    
    return stageMap[stage] || stage;
  };

  const confirmDelete = (id: string) => {
    setDeletingId(id);
  };

  const handleConfirmDelete = () => {
    if (deletingId) {
      onDelete(deletingId);
      setDeletingId(null);
    }
  };

  const cancelDelete = () => {
    setDeletingId(null);
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum progresso registrado
          </h3>
          <p className="text-muted-foreground mb-4">
            Nenhum registro de progresso foi encontrado para este projeto.
          </p>
          <p className="text-sm text-muted-foreground">
            Clique em "Novo Registro" para adicionar um acompanhamento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="mx-auto w-full max-w-4xl">
        <div className="border-l-2 border-balix-accent/30 ml-4">
          {records.map((record, index) => (
            <div key={record.id} className="relative pb-8">
              <div className="absolute top-0 -left-[9px] mt-1.5 h-4 w-4 rounded-full border-2 border-white bg-balix-accent shadow-sm"></div>
              <div className="ml-8 pt-0.5">
                <Card className="p-6 mb-2 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-balix-accent/10 text-balix-accent">
                          {getStageLabel(record.stage_name)}
                        </span>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <CalendarIcon className="mr-1 h-4 w-4" />
                          <time dateTime={record.start_date}>
                            {format(new Date(record.start_date), 'dd MMMM yyyy', { locale: ptBR })}
                          </time>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => onEdit(record)}
                        className="h-8 px-3"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => confirmDelete(record.id)}
                        className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Descrição</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">{record.description}</p>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-600 mb-2">Progresso da Etapa</h5>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-balix-accent h-3 rounded-full transition-all duration-300" 
                            style={{ width: `${record.execution_percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-balix-accent min-w-[3rem]">
                          {record.execution_percentage}%
                        </span>
                      </div>
                    </div>
                    
                    {record.image_url && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-600">Registro Fotográfico</h5>
                        <div className="flex items-center gap-3">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8">
                                <Eye className="h-3 w-3 mr-1" />
                                Visualizar Imagem
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>
                                  {getStageLabel(record.stage_name)} - {format(new Date(record.start_date), 'dd/MM/yyyy')}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="flex justify-center">
                                <img
                                  src={record.image_url}
                                  alt={`Progresso da etapa ${getStageLabel(record.stage_name)}`}
                                  className="max-h-96 w-auto object-contain rounded-lg"
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                          <a 
                            href={record.image_url} 
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
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <AlertDialog open={!!deletingId} onOpenChange={() => deletingId && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro de progresso?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProgressTimeline;
