
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Folder } from 'lucide-react';
import { ProgressRecord } from '@/types/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { useProject } from '@/contexts/ProjectContext';

interface ProgressTableProps {
  records: ProgressRecord[];
  onEdit: (record: ProgressRecord) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const ProgressTable: React.FC<ProgressTableProps> = ({ records, onEdit, onDelete, isLoading = false }) => {
  const { selectedProjectId } = useProject();
  const navigate = useNavigate();

  const getStageLabel = (stage: string) => {
    const stageMap: Record<string, string> = {
      'foundation': 'Fundação', 'structure': 'Estrutura', 'masonry': 'Alvenaria',
      'roofing': 'Cobertura', 'electrical': 'Elétrica', 'plumbing': 'Hidráulica',
      'finishing': 'Acabamento', 'landscaping': 'Paisagismo', 'other': 'Outro'
    };
    return stageMap[stage] || stage;
  };

  const getStatusFromPercentage = (percentage: number) => {
    if (percentage === 0) return { label: 'Não Iniciado', color: 'bg-gray-100 text-gray-800' };
    if (percentage < 100) return { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' };
    return { label: 'Concluído', color: 'bg-green-100 text-green-800' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-balix-accent mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Carregando registros de progresso...</p>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum registro de progresso encontrado</h3>
          <p className="text-gray-500 mb-4">Nenhuma etapa de progresso foi encontrada para este projeto.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Atividade Principal</TableHead>
            <TableHead>Data Início</TableHead>
            <TableHead>Data Fim</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progresso</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => {
            const status = getStatusFromPercentage(record.execution_percentage || 0);
            return (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.stage_name}</TableCell>
                <TableCell>{record.start_date ? format(new Date(record.start_date), "dd/MM/yyyy", { locale: ptBR }) : '-'}</TableCell>
                <TableCell>{record.end_date ? format(new Date(record.end_date), "dd/MM/yyyy", { locale: ptBR }) : '-'}</TableCell>
                <TableCell><Badge className={status.color}>{status.label}</Badge></TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={record.execution_percentage || 0} className="w-20" />
                    <span className="text-sm font-medium">{record.execution_percentage || 0}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      title="Gerenciar atividade"
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate(`/acompanhamento/etapas/${record.id}`)} 
                      className="h-8 w-8 p-0 border-balix-accent text-balix-accent hover:bg-balix-accent hover:text-white"
                    >
                      <Folder className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProgressTable;
