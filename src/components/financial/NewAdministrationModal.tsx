import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { Loader2, AlertCircle, Info, Calendar, DollarSign, ListOrdered } from 'lucide-react';
import { addMonths, setDate, lastDayOfMonth, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Installment {
  numero_parcela: number;
  valor: number;
  data_vencimento: string;
}

interface NewAdministrationModalProps {
  projectId: string;
  initialData?: any;
  onClose: (refresh?: boolean) => void;
}

export const NewAdministrationModal: React.FC<NewAdministrationModalProps> = ({ 
  projectId, 
  initialData,
  onClose 
}) => {
  const [valorTotal, setValorTotal] = useState(initialData?.valor_total?.toString() || '');
  const [parcelas, setParcelas] = useState(initialData?.quantidade_parcelas?.toString() || '');
  const [diaPagamento, setDiaPagamento] = useState(initialData?.dia_pagamento?.toString() || '');
  const [dataInicio, setDataInicio] = useState(initialData?.data_inicio || '');
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(!initialData);
  const { toast } = useToast();

  const isEditing = !!initialData;

  // Standard input styles as requested
  // Use standard system patterns
  const inputClassName = "bg-background/80";
  const labelClassName = ""; // Use standard Label styling

  useEffect(() => {
    if (!isAutoGenerating) return;

    const valorNum = parseFloat(valorTotal);
    const parcelasNum = parseInt(parcelas);
    const diaNum = parseInt(diaPagamento);

    if (isNaN(valorNum) || isNaN(parcelasNum) || isNaN(diaNum) || !dataInicio) {
      setInstallments([]);
      return;
    }

    const valorBase = valorNum / parcelasNum;
    const startDate = new Date(dataInicio);
    const newInstallments: Installment[] = [];

    for (let i = 1; i <= parcelasNum; i++) {
      let dueDate = addMonths(startDate, i);
      const lastDay = lastDayOfMonth(dueDate).getDate();
      const actualDay = Math.min(diaNum, lastDay);
      dueDate = setDate(dueDate, actualDay);

      newInstallments.push({
        numero_parcela: i,
        valor: parseFloat(valorBase.toFixed(2)),
        data_vencimento: format(dueDate, 'yyyy-MM-dd')
      });
    }

    if (newInstallments.length > 0) {
      const sum = newInstallments.reduce((acc, inst) => acc + inst.valor, 0);
      const diff = valorNum - sum;
      if (Math.abs(diff) > 0.001) {
        newInstallments[newInstallments.length - 1].valor = parseFloat((newInstallments[newInstallments.length - 1].valor + diff).toFixed(2));
      }
    }

    setInstallments(newInstallments);
  }, [valorTotal, parcelas, diaPagamento, dataInicio, isAutoGenerating]);

  useEffect(() => {
    if (isEditing && initialData.id) {
      fetchExistingInstallments();
    }
  }, [initialData]);

  const fetchExistingInstallments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('administracao_parcelas')
        .select('*')
        .eq('administracao_id', initialData.id)
        .order('numero_parcela', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        setIsAutoGenerating(false);
        setInstallments(data.map(d => ({
          numero_parcela: d.numero_parcela,
          valor: parseFloat(d.valor),
          data_vencimento: d.data_vencimento
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentSum = useMemo(() => {
    return installments.reduce((acc, inst) => acc + inst.valor, 0);
  }, [installments]);

  const isSumValid = Math.abs(currentSum - parseFloat(valorTotal)) < 0.01;

  const handleInstallmentValueChange = (index: number, newValue: string) => {
    setIsAutoGenerating(false);
    const updated = [...installments];
    updated[index].valor = parseFloat(newValue) || 0;
    setInstallments(updated);
  };

  const handleSave = async () => {
    const valorNum = parseFloat(valorTotal);
    const parcelasNum = parseInt(parcelas);
    const diaNum = parseInt(diaPagamento);

    if (!isSumValid) {
      toast({ 
        title: "Soma inválida", 
        description: `A soma das parcelas (R$ ${currentSum.toFixed(2)}) deve ser igual ao valor total (R$ ${valorNum.toFixed(2)}).`, 
        variant: "destructive" 
      });
      return;
    }

    setIsLoading(true);

    try {
      let admId = initialData?.id;

      if (isEditing) {
        const { error: updateError } = await (supabase as any)
          .from('administracao')
          .update({
            valor_total: valorNum,
            quantidade_parcelas: parcelasNum,
            dia_pagamento: diaNum,
            data_inicio: dataInicio
          })
          .eq('id', admId);

        if (updateError) throw updateError;

        const { error: deleteError } = await (supabase as any)
          .from('administracao_parcelas')
          .delete()
          .eq('administracao_id', admId);

        if (deleteError) throw deleteError;
      } else {
        const { data: admData, error: admError } = await (supabase as any)
          .from('administracao')
          .insert({
            project_id: projectId,
            valor_total: valorNum,
            quantidade_parcelas: parcelasNum,
            dia_pagamento: diaNum,
            data_inicio: dataInicio
          })
          .select()
          .single();

        if (admError) throw admError;
        admId = admData.id;
      }

      const installmentsToInsert = installments.map(inst => ({
        administracao_id: admId,
        numero_parcela: inst.numero_parcela,
        valor: inst.valor,
        data_vencimento: inst.data_vencimento,
        status: 'pendente'
      }));

      const { error: instError } = await (supabase as any)
        .from('administracao_parcelas')
        .insert(installmentsToInsert);

      if (instError) throw instError;

      toast({ title: "Sucesso", description: `Administração ${isEditing ? 'atualizada' : 'cadastrada'} com sucesso.` });
      onClose(true);
    } catch (error: any) {
      console.error('Error saving administration:', error);
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pt-2 pb-2">
      <div className="rounded-2xl border border-border bg-secondary/30 p-5 space-y-6">
        <div className="mb-5 space-y-1">
          <h3 className="text-lg font-semibold text-foreground">Informações da Administração</h3>
          <p className="text-sm text-muted-foreground">
            Configure os valores e prazos do contrato de administração.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="valor">Valor Total ADM</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input 
                id="valor" 
                type="number" 
                step="0.01"
                placeholder="0,00" 
                className={cn(inputClassName, "pl-10 text-right")}
                value={valorTotal} 
                onChange={(e) => {
                  setValorTotal(e.target.value);
                  setIsAutoGenerating(true);
                }} 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="parcelas">Quantidade de Parcelas</Label>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                type="button"
                className="h-10 w-10 shrink-0 bg-background/80"
                onClick={() => {
                  const val = Math.max(1, parseInt(parcelas || '1') - 1);
                  setParcelas(val.toString());
                  setIsAutoGenerating(true);
                }}
              >
                <span className="text-xl font-light text-white/60">-</span>
              </Button>
              <Input 
                id="parcelas" 
                type="number" 
                className={cn(inputClassName, "text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none")}
                value={parcelas} 
                onChange={(e) => {
                  setParcelas(e.target.value);
                  setIsAutoGenerating(true);
                }} 
              />
              <Button 
                variant="outline" 
                size="icon" 
                type="button"
                className="h-10 w-10 shrink-0 bg-background/80"
                onClick={() => {
                  const val = parseInt(parcelas || '0') + 1;
                  setParcelas(val.toString());
                  setIsAutoGenerating(true);
                }}
              >
                <span className="text-xl font-light">+</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dia">Dia de Pagamento</Label>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                type="button"
                className="h-10 w-10 shrink-0 bg-background/80"
                onClick={() => {
                  const val = Math.max(1, parseInt(diaPagamento || '1') - 1);
                  setDiaPagamento(val.toString());
                  setIsAutoGenerating(true);
                }}
              >
                <span className="text-xl font-light">-</span>
              </Button>
              <Input 
                id="dia" 
                type="number" 
                min="1"
                max="31"
                className={cn(inputClassName, "text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none")}
                value={diaPagamento} 
                onChange={(e) => {
                  setDiaPagamento(e.target.value);
                  setIsAutoGenerating(true);
                }} 
              />
              <Button 
                variant="outline" 
                size="icon" 
                type="button"
                className="h-10 w-10 shrink-0 bg-background/80"
                onClick={() => {
                  const val = Math.min(31, parseInt(diaPagamento || '0') + 1);
                  setDiaPagamento(val.toString());
                  setIsAutoGenerating(true);
                }}
              >
                <span className="text-xl font-light">+</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inicio">Data de Início</Label>
            <div className="relative">
              <Input 
                id="inicio" 
                type="date" 
                className={cn(inputClassName, "[color-scheme:dark] w-full")}
                value={dataInicio} 
                onChange={(e) => {
                  setDataInicio(e.target.value);
                  setIsAutoGenerating(true);
                }} 
              />
            </div>
          </div>
        </div>
      </div>

      {installments.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <ListOrdered className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold text-foreground">Configuração de Parcelas</h4>
            </div>
            <div className={cn(
              "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border",
              isSumValid ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-orange-500/10 text-orange-500 border-orange-500/20 animate-pulse"
            )}>
              Total Conferido: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentSum)}
            </div>
          </div>

          {!isSumValid && (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs shadow-lg">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="font-medium">Diferença detectada: A soma deve ser exatamente **R$ {parseFloat(valorTotal || '0').toLocaleString('pt-BR')}**</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {installments.map((inst, index) => (
              <div 
                key={index} 
                className="flex items-center gap-4 bg-secondary/20 border border-border p-3 rounded-xl hover:bg-secondary/30 transition-all group"
              >
                <div className="h-10 w-10 shrink-0 rounded-lg bg-background/50 flex items-center justify-center font-black text-muted-foreground text-xs border border-border group-hover:border-primary/30 group-hover:text-primary transition-colors">
                  #{String(inst.numero_parcela).padStart(2, '0')}
                </div>
                
                <div className="flex-1 space-y-1">
                  <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">Valor Parcela</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input 
                      type="number"
                      step="0.01"
                      value={inst.valor}
                      onChange={(e) => handleInstallmentValueChange(index, e.target.value)}
                      className="h-9 text-right text-sm font-bold bg-background/50 border-border pl-7 rounded-lg focus:border-primary"
                    />
                  </div>
                </div>

                <div className="w-24 text-right pr-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter mb-1">Vencimento</p>
                  <p className="text-xs font-medium text-foreground/70">
                    {new Date(inst.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground italic bg-secondary/10 p-3 rounded-lg border border-border">
            <Info className="h-3.5 w-3.5" />
            Vencimentos calculados conforme data de início e dia de pagamento. Os valores podem ser editados individualmente.
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-6 border-t border-border">
        <Button variant="outline" onClick={() => onClose()} disabled={isLoading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={isLoading || !isSumValid || installments.length === 0}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Salvar Alterações' : 'Salvar Administração'}
        </Button>
      </div>
    </div>
  );
};
