import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { format } from 'date-fns';
import { ProgressRecord } from '@/types/progress';
import ImageUpload from '@/components/common/ImageUpload';

const progressSchema = z.object({
  stage_name: z.string().min(1, 'Nome da etapa é obrigatório'),
  description: z.string().optional(),
  start_date: z.string().min(1, 'Data de início é obrigatória'),
  end_date: z.string().min(1, 'Data de término é obrigatória'),
  status: z.enum(['pendente', 'em_andamento', 'concluido']),
  execution_percentage: z.number().min(0).max(100),
});

type ProgressFormData = z.infer<typeof progressSchema>;

interface ProgressFormProps {
  record?: ProgressRecord;
  onClose: (refresh?: boolean) => void;
}

const ProgressForm: React.FC<ProgressFormProps> = ({ record, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>(record?.image_url ? [record.image_url] : []);
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedProjectId } = useProject();

  const form = useForm<ProgressFormData>({
    resolver: zodResolver(progressSchema),
    defaultValues: {
      stage_name: record?.stage_name || '',
      description: record?.description || '',
      start_date: record?.start_date || format(new Date(), 'yyyy-MM-dd'),
      end_date: record?.end_date || format(new Date(), 'yyyy-MM-dd'),
      status: (record?.status as 'pendente' | 'em_andamento' | 'concluido') || 'pendente',
      execution_percentage: record?.execution_percentage || 0,
    },
  });

  const onSubmit = async (data: ProgressFormData) => {
    if (!user || !selectedProjectId) {
      toast({
        title: 'Erro',
        description: !selectedProjectId ? 'Selecione uma obra primeiro.' : 'Você precisa estar logado.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const recordData = {
        stage_name: data.stage_name,
        description: data.description || null,
        start_date: data.start_date,
        end_date: data.end_date,
        status: data.status,
        execution_percentage: data.execution_percentage,
        image_url: imageUrls.length > 0 ? imageUrls[0] : null,
        user_id: user.id,
        project_id: selectedProjectId,
      };

      if (record) {
        const { error } = await supabase
          .from('project_stages')
          .update(recordData)
          .eq('id', record.id);
        if (error) throw error;
        toast({ title: 'Etapa atualizada', description: 'A etapa foi atualizada com sucesso.' });
      } else {
        const { error } = await supabase
          .from('project_stages')
          .insert(recordData);
        if (error) throw error;
        toast({ title: 'Etapa registrada', description: 'A nova etapa foi registrada com sucesso.' });
      }

      onClose(true);
    } catch (error: any) {
      toast({ title: 'Erro ao salvar etapa', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="stage_name" render={({ field }) => (
          <FormItem><FormLabel>Nome da Etapa</FormLabel><FormControl><Input placeholder="Ex: Fundação, Estrutura..." {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Descreva as atividades desta etapa..." className="min-h-[80px]" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="start_date" render={({ field }) => (
            <FormItem><FormLabel>Data de Início</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="end_date" render={({ field }) => (
            <FormItem><FormLabel>Data de Término</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem><FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="pendente">🔄 Pendente</SelectItem>
                  <SelectItem value="em_andamento">⚡ Em Andamento</SelectItem>
                  <SelectItem value="concluido">✅ Concluído</SelectItem>
                </SelectContent>
              </Select><FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="execution_percentage" render={({ field }) => (
            <FormItem><FormLabel>Progresso (%)</FormLabel><FormControl>
              <Input type="number" min="0" max="100" placeholder="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
            </FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div>
          <FormLabel>Imagem da Etapa (Opcional)</FormLabel>
          {user && <ImageUpload onUpload={setImageUrls} existingImages={imageUrls} multiple={false} userId={user.id} />}
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onClose()}>Cancelar</Button>
          <Button type="submit" disabled={isLoading} className="bg-balix-accent hover:bg-balix-accent/90">
            {isLoading ? 'Salvando...' : record ? 'Atualizar' : 'Registrar'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProgressForm;
