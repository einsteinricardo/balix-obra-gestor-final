
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { format } from 'date-fns';

const ganttTaskSchema = z.object({
  task_name: z.string().min(1, 'Nome da tarefa é obrigatório'),
  start_date: z.string().min(1, 'Data de início é obrigatória'),
  end_date: z.string().min(1, 'Data de término é obrigatória'),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  progress: z.number().min(0).max(100),
});

type GanttTaskFormData = z.infer<typeof ganttTaskSchema>;

interface GanttTask {
  id: string;
  task_name: string;
  start_date: string;
  end_date: string;
  status: string;
  progress: number;
  user_id: string;
}

interface GanttTaskFormProps {
  task?: GanttTask;
  onClose: (refresh?: boolean) => void;
}

const GanttTaskForm: React.FC<GanttTaskFormProps> = ({ task, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedProjectId } = useProject();

  const form = useForm<GanttTaskFormData>({
    resolver: zodResolver(ganttTaskSchema),
    defaultValues: {
      task_name: task?.task_name || '',
      start_date: task?.start_date || format(new Date(), 'yyyy-MM-dd'),
      end_date: task?.end_date || format(new Date(), 'yyyy-MM-dd'),
      status: (task?.status as 'not_started' | 'in_progress' | 'completed') || 'not_started',
      progress: task?.progress || 0,
    },
  });

  const onSubmit = async (data: GanttTaskFormData) => {
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
      const taskData = {
        task_name: data.task_name,
        start_date: data.start_date,
        end_date: data.end_date,
        status: data.status,
        progress: data.progress,
        user_id: user.id,
        project_id: selectedProjectId,
      };

      if (task) {
        const { error } = await supabase.from('gantt_tasks').update(taskData).eq('id', task.id);
        if (error) throw error;
        toast({ title: 'Tarefa atualizada', description: 'A tarefa foi atualizada com sucesso.' });
      } else {
        const { error } = await supabase.from('gantt_tasks').insert(taskData);
        if (error) throw error;
        toast({ title: 'Tarefa criada', description: 'A nova tarefa foi criada com sucesso.' });
      }

      onClose(true);
    } catch (error: any) {
      toast({ title: 'Erro ao salvar tarefa', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="task_name" render={({ field }) => (
          <FormItem><FormLabel>Nome da Tarefa</FormLabel><FormControl><Input placeholder="Ex: Fundação, Estrutura..." {...field} /></FormControl><FormMessage /></FormItem>
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
                  <SelectItem value="not_started">🔄 Não Iniciado</SelectItem>
                  <SelectItem value="in_progress">⚡ Em Progresso</SelectItem>
                  <SelectItem value="completed">✅ Concluído</SelectItem>
                </SelectContent>
              </Select><FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="progress" render={({ field }) => (
            <FormItem><FormLabel>Progresso (%)</FormLabel><FormControl>
              <Input type="number" min="0" max="100" placeholder="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
            </FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onClose()}>Cancelar</Button>
          <Button type="submit" disabled={isLoading} className="bg-balix-accent hover:bg-balix-accent/90">
            {isLoading ? 'Salvando...' : task ? 'Atualizar' : 'Criar'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default GanttTaskForm;
