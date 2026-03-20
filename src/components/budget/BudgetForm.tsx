
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { ATIVIDADES_PRINCIPAIS } from '@/types/budget';

const budgetSchema = z.object({
  atividade_principal: z.string().min(1, 'Selecione uma atividade principal'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  unidade: z.enum(['m', 'm²', 'm³', 'vb']),
  quantidade: z.number().min(0, 'Quantidade deve ser maior que zero'),
  custo_material: z.number().min(0, 'Custo do material deve ser maior ou igual a zero'),
  custo_mao_obra: z.number().min(0, 'Custo da mão de obra deve ser maior ou igual a zero'),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

export interface EditingAtividade {
  id: string;
  orcamento_id: string;
  atividade_principal: string;
  descricao: string;
  unidade: 'm' | 'm²' | 'm³' | 'vb';
  quantidade: number;
  custo_material: number;
  custo_mao_obra: number;
}

interface BudgetFormProps {
  onClose: (refresh?: boolean) => void;
  editingData?: EditingAtividade | null;
}

const BudgetForm: React.FC<BudgetFormProps> = ({ onClose, editingData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedProjectId } = useProject();

  const {
    register, handleSubmit, setValue, watch, formState: { errors }
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      atividade_principal: editingData?.atividade_principal || '',
      descricao: editingData?.descricao || '',
      unidade: editingData?.unidade || undefined,
      quantidade: editingData?.quantidade || 0,
      custo_material: editingData?.custo_material || 0,
      custo_mao_obra: editingData?.custo_mao_obra || 0
    }
  });

  const watchedValues = watch();

  const onSubmit = async (data: BudgetFormData) => {
    if (!user || !selectedProjectId) {
      toast({ title: 'Erro', description: 'Selecione uma obra primeiro.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingData) {
        const { error } = await supabase
          .from('orcamento_atividades')
          .update({
            descricao: data.descricao, unidade: data.unidade,
            quantidade: data.quantidade, custo_material: data.custo_material,
            custo_mao_obra: data.custo_mao_obra,
          })
          .eq('id', editingData.id);
        if (error) throw error;

        if (data.atividade_principal !== editingData.atividade_principal) {
          let { data: targetOrcamento, error: searchError } = await supabase
            .from('orcamentos').select('id')
            .eq('user_id', user.id).eq('project_id', selectedProjectId)
            .eq('atividade_principal', data.atividade_principal).single();
          if (searchError && searchError.code !== 'PGRST116') throw searchError;

          let targetOrcamentoId: string;
          if (!targetOrcamento) {
            const { data: newOrc, error: newErr } = await supabase
              .from('orcamentos')
              .insert({ user_id: user.id, project_id: selectedProjectId, atividade_principal: data.atividade_principal })
              .select('id').single();
            if (newErr) throw newErr;
            targetOrcamentoId = newOrc.id;
          } else {
            targetOrcamentoId = targetOrcamento.id;
          }

          const { error: moveError } = await supabase
            .from('orcamento_atividades').update({ orcamento_id: targetOrcamentoId }).eq('id', editingData.id);
          if (moveError) throw moveError;
        }

        toast({ title: 'Atividade atualizada', description: 'A atividade foi atualizada com sucesso.' });
      } else {
        let { data: existingOrcamento, error: searchError } = await supabase
          .from('orcamentos').select('id')
          .eq('user_id', user.id).eq('project_id', selectedProjectId)
          .eq('atividade_principal', data.atividade_principal).single();
        if (searchError && searchError.code !== 'PGRST116') throw searchError;

        let orcamentoId: string;
        if (!existingOrcamento) {
          const { data: newOrcamento, error: orcamentoError } = await supabase
            .from('orcamentos')
            .insert({ user_id: user.id, project_id: selectedProjectId, atividade_principal: data.atividade_principal })
            .select('id').single();
          if (orcamentoError) throw orcamentoError;
          orcamentoId = newOrcamento.id;
        } else {
          orcamentoId = existingOrcamento.id;
        }

        const { error: atividadeError } = await supabase
          .from('orcamento_atividades')
          .insert({
            orcamento_id: orcamentoId, descricao: data.descricao,
            unidade: data.unidade, quantidade: data.quantidade,
            custo_material: data.custo_material, custo_mao_obra: data.custo_mao_obra,
          });
        if (atividadeError) throw atividadeError;

        toast({ title: 'Atividade criada', description: 'A atividade orçamentária foi criada com sucesso.' });
      }

      onClose(true);
    } catch (error: any) {
      toast({ title: editingData ? 'Erro ao atualizar atividade' : 'Erro ao criar atividade', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="atividade_principal" className="text-[#8b4a12]">Atividade Principal</Label>
          <Select defaultValue={editingData?.atividade_principal} onValueChange={(value) => setValue('atividade_principal', value)}>
            <SelectTrigger className="bg-[#262d1f] border-[#7b420e] text-white"><SelectValue placeholder="Selecione uma atividade principal" /></SelectTrigger>
            <SelectContent className="bg-[#262d1f] border-[#7b420e]">
              {ATIVIDADES_PRINCIPAIS.map((atividade) => (
                <SelectItem key={atividade} value={atividade} className="text-white hover:bg-[#1e2914]">{atividade}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.atividade_principal && <p className="text-red-500 text-sm mt-1">{errors.atividade_principal.message}</p>}
        </div>
        <div className="col-span-2">
          <Label htmlFor="descricao" className="text-[#8b4a12]">Descrição da Atividade</Label>
          <Input id="descricao" {...register('descricao')} className="bg-[#262d1f] border-[#7b420e] text-white" placeholder="Ex: Concretagem de laje" />
          {errors.descricao && <p className="text-red-500 text-sm mt-1">{errors.descricao.message}</p>}
        </div>
        <div>
          <Label htmlFor="unidade" className="text-[#8b4a12]">Unidade</Label>
          <Select defaultValue={editingData?.unidade} onValueChange={(value) => setValue('unidade', value as any)}>
            <SelectTrigger className="bg-[#262d1f] border-[#7b420e] text-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent className="bg-[#262d1f] border-[#7b420e]">
              <SelectItem value="m" className="text-white hover:bg-[#1e2914]">m</SelectItem>
              <SelectItem value="m²" className="text-white hover:bg-[#1e2914]">m²</SelectItem>
              <SelectItem value="m³" className="text-white hover:bg-[#1e2914]">m³</SelectItem>
              <SelectItem value="vb" className="text-white hover:bg-[#1e2914]">vb</SelectItem>
            </SelectContent>
          </Select>
          {errors.unidade && <p className="text-red-500 text-sm mt-1">{errors.unidade.message}</p>}
        </div>
        <div>
          <Label htmlFor="quantidade" className="text-[#8b4a12]">Quantidade</Label>
          <Input id="quantidade" type="number" step="0.01" {...register('quantidade', { valueAsNumber: true })} className="bg-[#262d1f] border-[#7b420e] text-white" />
          {errors.quantidade && <p className="text-red-500 text-sm mt-1">{errors.quantidade.message}</p>}
        </div>
        <div>
          <Label htmlFor="custo_material" className="text-[#8b4a12]">Custo Material (R$)</Label>
          <Input id="custo_material" type="number" step="0.01" {...register('custo_material', { valueAsNumber: true })} className="bg-[#262d1f] border-[#7b420e] text-white" />
          {errors.custo_material && <p className="text-red-500 text-sm mt-1">{errors.custo_material.message}</p>}
        </div>
        <div>
          <Label htmlFor="custo_mao_obra" className="text-[#8b4a12]">Custo Mão de Obra (R$)</Label>
          <Input id="custo_mao_obra" type="number" step="0.01" {...register('custo_mao_obra', { valueAsNumber: true })} className="bg-[#262d1f] border-[#7b420e] text-white" />
          {errors.custo_mao_obra && <p className="text-red-500 text-sm mt-1">{errors.custo_mao_obra.message}</p>}
        </div>
        <div className="col-span-2">
          <Label className="text-[#8b4a12]">Custo Total</Label>
          <div className="bg-[#262d1f] border border-[#7b420e] rounded-md px-3 py-2 text-white font-semibold">
            R$ {(((watchedValues.custo_material || 0) + (watchedValues.custo_mao_obra || 0)) * (watchedValues.quantidade || 0)).toFixed(2)}
          </div>
        </div>
      </div>
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={() => onClose()} className="flex-1 border-[#2f3b24] text-[#d6d6d6] hover:bg-[#2f3b24]">Cancelar</Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1 bg-[#dda23a] hover:bg-[#e8b949] text-[#151f0e]">
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
};

export default BudgetForm;
