import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GanttActivityPersistence, GanttChartViewTask } from '@/types/progress';
import { format } from 'date-fns';
import { Plus, Trash2, Link2 } from 'lucide-react';

const ganttTaskSchema = z.object({
  start_date: z.string().min(1, 'Data de início é obrigatória'),
  end_date: z.string().min(1, 'Data de término é obrigatória'),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  progress: z.number().min(0).max(100),
  fullDependencies: z.array(z.object({
    predecessora_id: z.string().min(1, 'Selecione uma atividade'),
    tipo: z.enum(['FS', 'SS', 'FF', 'SF']),
    lag: z.number(),
  })).default([]),
});

type GanttTaskFormData = z.infer<typeof ganttTaskSchema>;

interface GanttTaskFormProps {
  task: GanttActivityPersistence;
  allTasks: GanttChartViewTask[];
  onClose: (refresh?: boolean, simulatedData?: GanttTaskFormData) => void;
  simulationMode?: boolean;
}

const GanttTaskForm: React.FC<GanttTaskFormProps> = ({ task, allTasks, onClose, simulationMode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<GanttTaskFormData>({
    resolver: zodResolver(ganttTaskSchema),
    defaultValues: {
      start_date: task.data_inicio || format(new Date(), 'yyyy-MM-dd'),
      end_date: task.data_fim || format(new Date(), 'yyyy-MM-dd'),
      status: task.status || 'not_started',
      progress: task.progresso || 0,
      fullDependencies: task.fullDependencies?.map(d => ({
        predecessora_id: d.predecessora_id,
        tipo: d.tipo,
        lag: d.lag
      })) || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "fullDependencies"
  });

  const onSubmit = async (data: GanttTaskFormData) => {
    if (simulationMode) {
      toast({ 
        title: 'Simulação Aplicada', 
        description: 'As alterações foram aplicadas localmente para visualização.' 
      });
      onClose(true, data);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Update basic task data
      const updateData = {
        data_inicio: data.start_date,
        data_fim: data.end_date,
        status: data.status,
        progresso: data.progress,
        updated_at: new Date().toISOString()
      };

      const { error: taskError } = await (supabase
        .from('gantt_atividades' as any)
        .update(updateData)
        .eq('id', task.id) as any);

      if (taskError) throw taskError;

      // 2. Update dependencies (Delete old and insert new)
      const { error: deleteError } = await supabase
        .from('gantt_dependencies' as any)
        .delete()
        .eq('atividade_id', task.id);

      if (deleteError) throw deleteError;

      if (data.fullDependencies.length > 0) {
        const insertDeps = data.fullDependencies.map(d => ({
          atividade_id: task.id,
          predecessora_id: d.predecessora_id,
          tipo: d.tipo,
          lag: d.lag
        }));

        const { error: insertError } = await supabase
          .from('gantt_dependencies' as any)
          .insert(insertDeps);

        if (insertError) throw insertError;
      }
      
      toast({ 
        title: 'Cronograma atualizado', 
        description: 'Os dados e dependências foram salvos com sucesso.' 
      });

      onClose(true);
    } catch (error: any) {
      toast({ 
        title: 'Erro ao salvar alterações', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="start_date" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white font-semibold font-playfair">Data de Início</FormLabel>
              <FormControl>
                <Input 
                  type="date" 
                  {...field} 
                  className="bg-secondary/50 border-border/40 text-white focus-visible:ring-[#a2632a]" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="end_date" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white font-semibold font-playfair">Data de Término</FormLabel>
              <FormControl>
                <Input 
                  type="date" 
                  {...field} 
                  className="bg-secondary/50 border-border/40 text-white focus-visible:ring-[#a2632a]" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white font-semibold font-playfair">Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-secondary/50 border-border/40 text-white focus:ring-[#a2632a]">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-secondary border-border/40 text-white">
                  <SelectItem value="not_started">🔄 Não Iniciado</SelectItem>
                  <SelectItem value="in_progress">⚡ Em Progresso</SelectItem>
                  <SelectItem value="completed">✅ Concluído</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="progress" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white font-semibold font-playfair">Progresso (%)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0" 
                  max="100" 
                  {...field} 
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  className="bg-secondary/50 border-border/40 text-white focus-visible:ring-[#a2632a]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel className="text-white font-semibold font-playfair flex items-center gap-2">
              <Link2 className="h-4 w-4 text-[#a2632a]" />
              Dependências (Predecessores)
            </FormLabel>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => append({ predecessora_id: '', tipo: 'FS', lag: 0 })}
              className="h-7 text-[10px] border-[#a2632a]/40 hover:bg-[#a2632a]/10 text-[#a2632a]"
            >
              <Plus className="h-3 w-3 mr-1" />
              Adicionar Dependência
            </Button>
          </div>

          <ScrollArea className={`${fields.length > 0 ? 'h-[160px]' : 'h-auto'} w-full bg-secondary/20 rounded-lg border border-border/40 p-4`}>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-3 group bg-white/5 p-3 rounded-md border border-white/5">
                  <div className="flex-1 space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Atividade</p>
                    <FormField
                      control={form.control}
                      name={`fullDependencies.${index}.predecessora_id`}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-8 bg-transparent border-white/10 text-xs">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-secondary border-border/40 text-white">
                            {allTasks.map((t) => (
                              <SelectItem key={t.orcamento_id} value={t.orcamento_id}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="w-[80px] space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tipo</p>
                    <FormField
                      control={form.control}
                      name={`fullDependencies.${index}.tipo`}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-8 bg-transparent border-white/10 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-secondary border-border/40 text-white min-w-[60px]">
                            <SelectItem value="FS">FS</SelectItem>
                            <SelectItem value="SS">SS</SelectItem>
                            <SelectItem value="FF">FF</SelectItem>
                            <SelectItem value="SF">SF</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="w-[60px] space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Lag</p>
                    <FormField
                      control={form.control}
                      name={`fullDependencies.${index}.lag`}
                      render={({ field }) => (
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="h-8 bg-transparent border-white/10 text-xs px-2"
                        />
                      )}
                    />
                  </div>

                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => remove(index)}
                    className="h-8 w-8 text-red-500/50 hover:text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {fields.length === 0 && (
                <div className="py-4 text-center">
                  <p className="text-[10px] text-muted-foreground italic">Nenhuma dependência definida para esta atividade.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex justify-end space-x-2 pt-6 border-t border-border/40">
          <Button type="button" variant="ghost" onClick={() => onClose()} className="text-muted-foreground hover:bg-white/5 hover:text-white">
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-[#a2632a] hover:bg-[#a2632a]/90 text-white px-8 font-bold shadow-lg">
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default GanttTaskForm;
