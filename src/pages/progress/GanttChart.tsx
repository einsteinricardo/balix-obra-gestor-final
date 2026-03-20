
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/components/layout/AppLayout';
import GanttChartView from '@/components/progress/GanttChartView';
import GanttTaskForm from '@/components/progress/GanttTaskForm';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import PermissionGuard from '@/components/rbac/PermissionGuard';

interface GanttTask {
  id: string;
  project_id?: string;
  task_name: string;
  start_date: string;
  end_date: string;
  status: string;
  progress: number;
  created_at: string;
  user_id: string;
}

interface GanttChartViewTask {
  id: string;
  stage: string;
  start: string;
  end: string;
  progress: number;
  status: 'not-started' | 'in-progress' | 'completed';
}

const GanttChart = () => {
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<GanttTask | null>(null);
  const [viewStartDate, setViewStartDate] = useState(new Date());
  const [viewEndDate, setViewEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const { selectedProjectId } = useProject();

  useEffect(() => {
    if (!authLoading && user && selectedProjectId) fetchTasks();
  }, [user, authLoading, selectedProjectId]);

  const fetchTasks = async () => {
    if (!user || !selectedProjectId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('gantt_tasks').select('*').eq('project_id', selectedProjectId).order('start_date', { ascending: true });
      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      toast({ title: 'Erro ao carregar tarefas do cronograma', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('gantt_tasks').delete().eq('id', id);
      if (error) throw error;
      setTasks(tasks.filter(task => task.id !== id));
      toast({ title: 'Tarefa excluída', description: 'A tarefa foi excluída com sucesso.' });
    } catch (error: any) {
      toast({ title: 'Erro ao excluir tarefa', description: error.message, variant: 'destructive' });
    }
  };

  const handleEditTask = (chartTask: any) => {
    const originalTask = tasks.find(t => t.id === chartTask.id);
    if (originalTask) { setEditTask(originalTask); setFormOpen(true); }
  };

  const handleFormClose = (refresh = false) => { setFormOpen(false); setEditTask(null); if (refresh) fetchTasks(); };
  const handleTimeRangeChange = (start: Date, end: Date) => { setViewStartDate(start); setViewEndDate(end); };

  if (authLoading) return <AppLayout><div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-balix-accent"></div></div></AppLayout>;
  if (!user) return <AppLayout><div className="text-center py-12"><p className="text-lg text-gray-600">Você precisa estar logado para ver o cronograma.</p></div></AppLayout>;

  const ganttTasks: GanttChartViewTask[] = tasks.map(task => ({
    id: task.id, stage: task.task_name, start: task.start_date, end: task.end_date, progress: task.progress,
    status: task.status === 'not_started' ? 'not-started' : task.status === 'in_progress' ? 'in-progress' : 'completed'
  }));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-balix-dark">Cronograma - Gráfico de Gantt</h2>
            <p className="text-muted-foreground">Visualize e gerencie o cronograma da sua obra.</p>
          </div>
          <PermissionGuard module="cronograma" action="create" obraId={selectedProjectId}>
            <div className="flex gap-2">
              <Button onClick={() => setFormOpen(true)} className="bg-balix-accent hover:bg-balix-accent/90 text-white">
                <Plus className="mr-2 h-4 w-4" />Nova Tarefa
              </Button>
            </div>
          </PermissionGuard>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-balix-accent mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Carregando cronograma...</p>
            </div>
          </div>
        ) : (
          <GanttChartView tasks={ganttTasks} onEditTask={handleEditTask} viewStartDate={viewStartDate} viewEndDate={viewEndDate} onTimeRangeChange={handleTimeRangeChange} />
        )}

        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader><DialogTitle className="text-balix-dark">{editTask ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle></DialogHeader>
            <GanttTaskForm task={editTask} onClose={handleFormClose} />
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default GanttChart;
