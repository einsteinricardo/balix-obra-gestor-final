
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { addAllTestData } from '@/utils/testData';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Database, FileCheck, Loader2 } from 'lucide-react';

export const TestDataSetup: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const handleAddTestData = async () => {
    if (!user?.id) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para adicionar dados de teste.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await addAllTestData(user.id);
      
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: 'Dados de teste adicionados com sucesso.',
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar dados de teste',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsDialogOpen(false);
    }
  };
  
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Database className="w-4 h-4" />
          Adicionar Dados de Teste
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Dados de Teste</DialogTitle>
          <DialogDescription>
            Esta ação irá adicionar dados de teste ao sistema, incluindo projetos, documentos, 
            registros de progresso, diário de obras e dados financeiros. 
            Deseja continuar?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAddTestData} 
            disabled={isLoading}
            className="bg-balix-accent hover:bg-balix-accent/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adicionando...
              </>
            ) : (
              <>
                <FileCheck className="mr-2 h-4 w-4" />
                Adicionar Dados
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
