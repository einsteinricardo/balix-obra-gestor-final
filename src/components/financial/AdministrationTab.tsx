import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Plus, Loader2, Edit, AlertCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NewAdministrationModal } from './NewAdministrationModal';

interface AdministrationTabProps {
  projectId: string;
  userRole?: string | null;
}

export const AdministrationTab: React.FC<AdministrationTabProps> = ({ projectId, userRole }) => {
  const [administration, setAdministration] = useState<any>(null);
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const isClient = userRole === 'Cliente' || userRole === 'cliente';

  useEffect(() => {
    if (projectId) fetchAdministrationData();
  }, [projectId]);

  const fetchAdministrationData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch the single administration record
      const { data: admData, error: admError } = await (supabase as any)
        .from('administracao')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (admError) throw admError;
      setAdministration(admData);

      if (admData) {
        // 2. Fetch installments for this administration
        const { data: partData, error: partError } = await (supabase as any)
          .from('administracao_parcelas')
          .select('*')
          .eq('administracao_id', admData.id)
          .order('numero_parcela', { ascending: true });

        if (partError) throw partError;
        setParcelas(partData || []);
      } else {
        setParcelas([]);
      }
    } catch (error: any) {
      console.error('Error fetching administration data:', error);
      toast({ title: "Erro", description: "Falha ao carregar dados administrativos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarcarComoPago = async (parcelaId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('administracao_parcelas')
        .update({
          status: 'pago',
          data_pagamento: new Date().toISOString()
        })
        .eq('id', parcelaId);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Parcela marcada como paga." });
      fetchAdministrationData();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({ title: "Erro", description: "Falha ao atualizar status.", variant: "destructive" });
    }
  };

  if (isLoading && parcelas.length === 0 && !administration) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#a2632a]" />
        <p className="text-white/40 text-sm animate-pulse">Carregando controlador administrativo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-secondary/30 border border-border rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Contrato de Administração</h3>
            <p className="text-sm text-muted-foreground">
              {administration 
                ? `Total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(administration.valor_total)} em ${administration.quantidade_parcelas}x`
                : "Nenhum contrato ativo para esta obra."}
            </p>
          </div>
        </div>
        
        {!isClient && (
          <Button 
            onClick={() => setIsModalOpen(true)}
            variant={administration ? "outline" : "default"}
            className="h-11 px-6 rounded-xl font-bold transition-all"
          >
            {administration ? (
              <><Edit className="mr-2 h-4 w-4" /> Editar Administração</>
            ) : (
              <><Plus className="mr-2 h-4 w-4" /> Iniciar Administração</>
            )}
          </Button>
        )}
      </div>

      {administration && (
        <Card className="bg-card border-border rounded-2xl overflow-hidden shadow-sm">
          <CardHeader className="border-b border-border bg-secondary/10 px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Cronograma de Parcelas</CardTitle>
              <div className="flex gap-4 text-[10px] items-center">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary/50"></span>
                  <span className="text-muted-foreground uppercase">Pago</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/30"></span>
                  <span className="text-muted-foreground uppercase">Pendente</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {parcelas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-white/20">
                <AlertCircle className="h-12 w-12 mb-2 opacity-50" />
                <p>Nenhuma parcela gerada para este contrato.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent bg-secondary/5">
                      <TableHead className="pl-6 h-12 text-muted-foreground text-[10px] font-black uppercase tracking-tighter">Parcela</TableHead>
                      <TableHead className="h-12 text-muted-foreground text-[10px] font-black uppercase tracking-tighter">Valor</TableHead>
                      <TableHead className="h-12 text-muted-foreground text-[10px] font-black uppercase tracking-tighter">Vencimento</TableHead>
                      <TableHead className="h-12 text-muted-foreground text-[10px] font-black uppercase tracking-tighter">Status</TableHead>
                      {!isClient && <TableHead className="pr-6 h-12 text-muted-foreground text-[10px] font-black uppercase tracking-tighter text-right">Ação</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parcelas.map((p) => (
                      <TableRow 
                        key={p.id} 
                        className={cn(
                          "border-border transition-all duration-300",
                          p.status === 'pago' ? "bg-secondary/5 opacity-50 hover:opacity-70" : "hover:bg-secondary/10"
                        )}
                      >
                        <TableCell className="pl-6 font-bold text-foreground h-14">
                          <span className="text-xs mr-1 text-muted-foreground font-normal">Nº</span>
                          {String(p.numero_parcela).padStart(2, '0')}
                        </TableCell>
                        <TableCell className="h-14">
                          <span className={cn(
                            "font-black text-sm",
                            p.status === 'pago' ? "text-muted-foreground" : "text-primary"
                          )}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor)}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs font-medium h-14">
                          {new Date(p.data_vencimento).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="h-14">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border-0",
                              p.status === 'pago' 
                                ? "bg-primary/10 text-primary" 
                                : "bg-muted/10 text-muted-foreground"
                            )}
                          >
                            {p.status === 'pago' ? 'Pago' : 'Pendente'}
                          </Badge>
                        </TableCell>
                        {!isClient && (
                          <TableCell className="pr-6 text-right h-14">
                            {p.status === 'pendente' && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 rounded-xl text-primary hover:bg-primary/10 hover:text-primary transition-all"
                                onClick={() => handleMarcarComoPago(p.id)}
                                title="Marcar como Pago"
                              >
                                <Check className="h-5 w-5" />
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          {administration && (
            <div className="bg-secondary/10 border-t border-border px-6 py-4 flex justify-between items-center text-muted-foreground">
              <span className="text-[10px] uppercase font-bold tracking-widest">
                Data do contrato: {new Date(administration.created_at).toLocaleDateString()}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest">
                ID: {administration.id.split('-')[0]}
              </span>
            </div>
          )}
        </Card>
      )}

      {!administration && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-3xl bg-secondary/10">
          <div className="h-20 w-20 rounded-2xl bg-secondary/20 flex items-center justify-center mb-6">
            <Plus className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <h4 className="text-xl font-bold text-foreground/60 mb-2" font-semibold>Pronto para começar?</h4>
          <p className="text-muted-foreground text-center max-w-xs mb-8 font-playfair">
            Cadastre o contrato de administração desta obra para automatizar o controle de parcelas mensais.
          </p>
          {!isClient && (
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="h-12 px-8 rounded-xl font-bold"
            >
              Iniciar Configuração
            </Button>
          )}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[1000px] w-[95vw] border-border bg-background p-8 rounded-[24px] shadow-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-semibold text-foreground tracking-tight">
              {administration ? 'Ajustar Administração' : 'Nova Administração'}
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              {administration ? 'Edite os parâmetros do contrato ou ajuste parcelas individuais.' : 'Configure o valor total e o parcelamento automático da obra.'}
            </p>
          </DialogHeader>
          <NewAdministrationModal 
            projectId={projectId} 
            initialData={administration}
            onClose={(refresh) => {
              setIsModalOpen(false);
              if (refresh) fetchAdministrationData();
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
