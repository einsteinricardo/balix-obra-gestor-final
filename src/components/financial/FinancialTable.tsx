
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface FinancialRecord {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  created_at: string;
}

interface FinancialTableProps {
  records: FinancialRecord[];
  onEdit: (record: FinancialRecord) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const FinancialTable: React.FC<FinancialTableProps> = ({ 
  records, 
  onEdit, 
  onDelete, 
  isLoading = false 
}) => {
  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      'materials': 'Materiais',
      'labor': 'Mão de Obra',
      'equipment': 'Equipamentos',
      'permits': 'Licenças',
      'utilities': 'Utilidades',
      'transport': 'Transporte',
      'other_expenses': 'Outras Despesas',
      'investment': 'Investimento',
      'payment': 'Pagamento',
      'financing': 'Financiamento',
      'other_income': 'Outras Receitas'
    };
    return categoryMap[category] || category;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-balix-accent mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Carregando registros financeiros...</p>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum registro financeiro encontrado
          </h3>
          <p className="text-gray-500 mb-4">
            Nenhuma movimentação financeira foi encontrada para este projeto.
          </p>
          <p className="text-sm text-gray-400">
            Clique em "Nova Movimentação" para adicionar o primeiro registro.
          </p>
        </div>
      </div>
    );
  }

  // Sort records by date (most recent first)
  const sortedRecords = [...records].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRecords.map((record) => (
            <TableRow key={record.id}>
              <TableCell>
                {format(new Date(record.date), "dd/MM/yyyy", { locale: ptBR })}
              </TableCell>
              <TableCell>
                <Badge 
                  className={
                    record.type === 'income' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }
                >
                  {record.type === 'income' ? 'Entrada' : 'Saída'}
                </Badge>
              </TableCell>
              <TableCell>
                {getCategoryLabel(record.category)}
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {record.description}
              </TableCell>
              <TableCell className={`text-right font-medium ${
                record.type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}>
                {record.type === 'income' ? '+' : '-'} {formatCurrency(record.amount)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(record)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir esta movimentação financeira? 
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => onDelete(record.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default FinancialTable;
