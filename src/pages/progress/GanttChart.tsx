import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/AppLayout';
import GanttChartView from '@/components/progress/GanttChartView';
import SCurveChart from '@/components/progress/SCurveChart';
import GanttTaskForm from '@/components/progress/GanttTaskForm';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { GanttChartViewTask, GanttActivityPersistence, GanttDependency } from '@/types/progress';
import { startOfDay, addDays, format, differenceInDays } from 'date-fns';
import { ATIVIDADES_PRINCIPAIS } from '@/types/budget';

/**
 * Parse a 'yyyy-MM-dd' string as LOCAL midnight (avoids UTC timezone shift).
 * `new Date('2025-03-10')` → UTC midnight → local day 9 in UTC-3.
 * `parseDateSafe('2025-03-10')` → local midnight → correct day 10.
 */
function parseDateSafe(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PURE FUNCTIONS — No React state, no side effects, no closures
// These functions TAKE data IN and RETURN data OUT. Nothing else.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Calculate task duration in days (consistent +1 everywhere).
 * A task from Mon to Mon = 1 day. Mon to Tue = 2 days.
 */
function getDurationDays(start: string, end: string): number {
  return Math.max(1, differenceInDays(parseDateSafe(end), parseDateSafe(start)) + 1);
}

/**
 * Given a start date and duration, calculate the end date.
 */
function calcularFim(startDate: Date, durationDays: number): Date {
  return addDays(startDate, Math.max(0, durationDays - 1));
}

/**
 * Given an end date and duration, calculate the start date.
 */
function calcularInicio(endDate: Date, durationDays: number): Date {
  return addDays(endDate, -Math.max(0, durationDays - 1));
}

/**
 * PURE dependency engine — applies all dependency constraints once.
 * FS/SS = direct assignment (MS Project standard): start IS set to pred.end + lag.
 * FF/SF = minimum constraint: end must be >= pred value.
 * Returns a NEW array with NEW task objects (immutable).
 */
function aplicarDependencias(
  tarefas: GanttChartViewTask[],
  dependencias: GanttDependency[]
): GanttChartViewTask[] {
  // Deep clone tasks to avoid mutation
  const resultado = tarefas.map(t => ({ ...t }));
  const mapById = new Map(resultado.map(t => [t.id, t]));
  const mapByOrcamento = new Map(resultado.map(t => [t.orcamento_id, t]));

  const findTask = (id: string) => mapById.get(id) || mapByOrcamento.get(id);

  dependencias.forEach(dep => {
    const atual = findTask(dep.atividade_id);
    const pred = findTask(dep.predecessora_id);
    if (!atual || !pred || atual.type === 'principal') return;

    const lag = dep.lag || 0;
    const duration = getDurationDays(atual.start, atual.end);
    const inicioPred = parseDateSafe(pred.start);
    const fimPred = parseDateSafe(pred.end);
    let novaDataInicio = parseDateSafe(atual.start);
    let novaDataFim = parseDateSafe(atual.end);

    switch (dep.tipo) {
      case 'FS': {
        // MS Project: FS = direct assignment. Start IS predecessor end + lag + 1 dia
        const targetStart = addDays(fimPred, lag + 1);
        novaDataInicio = targetStart;
        novaDataFim = calcularFim(novaDataInicio, duration);
        break;
      }
      case 'SS': {
        // MS Project: SS = direct assignment. Start IS predecessor start + lag.
        const targetStartSS = addDays(inicioPred, lag);
        novaDataInicio = targetStartSS;
        novaDataFim = calcularFim(novaDataInicio, duration);
        break;
      }
      case 'FF': {
        // MS Project: FF = direct assignment. End IS predecessor end + lag.
        const targetEndFF = addDays(fimPred, lag);
        novaDataFim = targetEndFF;
        novaDataInicio = calcularInicio(novaDataFim, duration);
        break;
      }
      case 'SF': {
        // MS Project: SF = direct assignment. End IS predecessor start + lag.
        const targetEndSF = addDays(inicioPred, lag);
        novaDataFim = targetEndSF;
        novaDataInicio = calcularInicio(novaDataFim, duration);
        break;
      }
    }

    atual.start = format(novaDataInicio, 'yyyy-MM-dd');
    atual.end = format(novaDataFim, 'yyyy-MM-dd');
    atual.duration = getDurationDays(atual.start, atual.end);
  });

  return resultado;
}

/**
 * PURE chain propagation — runs dependency engine N times to handle chains.
 * A→B→C: iteration 1 fixes B, iteration 2 fixes C.
 */
function calcularGantt(
  tarefas: GanttChartViewTask[],
  dependencias: GanttDependency[]
): GanttChartViewTask[] {
  if (dependencias.length === 0) return tarefas.map(t => ({ ...t }));
  
  let resultado = tarefas;
  for (let i = 0; i < tarefas.length; i++) {
    resultado = aplicarDependencias(resultado, dependencias);
  }
  return resultado;
}

/**
 * PURE diff — compares old vs new tasks and returns only changed ones.
 */
function diffTasks(
  oldTasks: GanttChartViewTask[],
  newTasks: GanttChartViewTask[]
): Record<string, GanttChartViewTask> {
  const dirty: Record<string, GanttChartViewTask> = {};
  const oldMap = new Map(oldTasks.map(t => [t.id, t]));
  
  newTasks.forEach(newTask => {
    if (newTask.type === 'principal') return;
    const oldTask = oldMap.get(newTask.id);
    if (!oldTask) return;
    if (
      oldTask.start !== newTask.start ||
      oldTask.end !== newTask.end ||
      oldTask.progress !== newTask.progress ||
      oldTask.status !== newTask.status
    ) {
      dirty[newTask.id] = newTask;
    }
  });
  
  return dirty;
}

/**
 * Collect ALL dependency objects from all tasks.
 */
function collectAllDependencies(tasks: GanttChartViewTask[]): GanttDependency[] {
  return tasks.flatMap(t => t.fullDependencies || []);
}

/**
 * Detect cycles in dependency graph.
 */
function detectaCiclo(taskId: string, targetId: string, tasks: GanttChartViewTask[]): boolean {
  const taskMap = new Map(tasks.map(t => [t.orcamento_id, t]));
  const visited = new Set<string>();
  const stack = [targetId];
  while (stack.length > 0) {
    const currentId = stack.pop()!;
    if (currentId === taskId) return true;
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    const task = taskMap.get(currentId);
    if (task?.fullDependencies) {
      task.fullDependencies.forEach(dep => stack.push(dep.predecessora_id));
    }
  }
  return false;
}

/**
 * CPM calculation (Critical Path Method) — PURE function.
 */
function calculateCPM(tasks: GanttChartViewTask[]): GanttChartViewTask[] {
  const result = tasks.map(t => ({ ...t }));
  const secondaryTasks = result.filter(t => t.type === 'secundaria');
  if (secondaryTasks.length === 0) return result;

  const taskMap = new Map<string, GanttChartViewTask>();
  secondaryTasks.forEach(t => {
    t.earlyStart = 0; t.earlyFinish = 0; t.lateStart = 0; t.lateFinish = 0; t.float = 0; t.is_critical = false;
    taskMap.set(t.orcamento_id, t);
  });

  const getDur = (t: GanttChartViewTask) => getDurationDays(t.start, t.end);

  secondaryTasks.forEach(t => { t.earlyStart = 0; t.earlyFinish = getDur(t); });
  
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 1000) {
    changed = false; iterations++;
    secondaryTasks.forEach(task => {
      if (!task.fullDependencies) return;
      task.fullDependencies.forEach(dep => {
        const pred = taskMap.get(dep.predecessora_id);
        if (!pred) return;
        const duration = getDur(task);
        let newEF = task.earlyFinish;
        switch (dep.tipo) {
          case 'FS': newEF = Math.max(newEF, pred.earlyFinish + dep.lag + duration + 1); break;
          case 'SS': newEF = Math.max(newEF, pred.earlyStart + dep.lag + duration); break;
          case 'FF': newEF = Math.max(newEF, pred.earlyFinish + dep.lag); break;
          case 'SF': newEF = Math.max(newEF, pred.earlyStart + dep.lag); break;
        }
        if (newEF > task.earlyFinish) { task.earlyFinish = newEF; task.earlyStart = newEF - duration; changed = true; }
      });
    });
  }

  const maxEF = Math.max(...secondaryTasks.map(t => t.earlyFinish), 0);
  secondaryTasks.forEach(t => { t.lateFinish = maxEF; t.lateStart = maxEF - getDur(t); });
  
  changed = true; iterations = 0;
  while (changed && iterations < 1000) {
    changed = false; iterations++;
    secondaryTasks.forEach(task => {
      secondaryTasks.forEach(potentialSuccessor => {
        if (!potentialSuccessor.fullDependencies) return;
        potentialSuccessor.fullDependencies.forEach(dep => {
          if (dep.predecessora_id !== task.orcamento_id) return;
          const duration = getDur(task);
          let newLS = task.lateStart;
          switch (dep.tipo) {
            case 'FS': newLS = Math.min(newLS, potentialSuccessor.earlyStart - dep.lag - duration - 1); break;
            case 'SS': newLS = Math.min(newLS, potentialSuccessor.earlyStart - dep.lag); break;
            case 'FF': newLS = Math.min(newLS, potentialSuccessor.earlyFinish - dep.lag - duration); break;
            case 'SF': newLS = Math.min(newLS, potentialSuccessor.earlyFinish - dep.lag); break;
          }
          if (newLS < task.lateStart) { task.lateStart = newLS; task.lateFinish = newLS + duration; changed = true; }
        });
      });
    });
  }

  secondaryTasks.forEach(t => {
    t.float = Math.max(0, t.lateStart - t.earlyStart);
    t.is_critical = t.float <= 0.5;
  });

  return result;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REACT COMPONENT — State management only, delegates logic to pure functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const GanttChart = () => {
  const [tasks, setTasks] = useState<GanttChartViewTask[]>([]);
  const [sCurveData, setSCurveData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<GanttChartViewTask | null>(null);
  const [viewStartDate, setViewStartDate] = useState(startOfDay(new Date()));
  const [viewEndDate, setViewEndDate] = useState(addDays(startOfDay(new Date()), 60));
  const [simulationMode, setSimulationMode] = useState(false);
  
  const [dirtyTasks, setDirtyTasks] = useState<Record<string, GanttChartViewTask>>({});
  const [dependencies, setDependencies] = useState<GanttDependency[]>([]);
  const [dirtyDependencies, setDirtyDependencies] = useState<GanttDependency[]>([]);

  function updateTask(task: GanttChartViewTask) {
    setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    setDirtyTasks(prev => ({
      ...prev,
      [task.id]: task
    }));
  }

  function updateDependencies(newDeps: GanttDependency[]) {
    setDependencies(newDeps);
    setDirtyDependencies(newDeps);
  }

  const processUserEdit = (modifiedTask: GanttChartViewTask) => {
    const updatedTasks = tasks.map(t => t.id === modifiedTask.id ? modifiedTask : t);
    const allDeps = collectAllDependencies(updatedTasks);
    const processed = calculateCPM(calcularGantt(updatedTasks, allDeps));
    
    if (!simulationMode) {
      const newDirty = diffTasks(tasks, processed);
      newDirty[modifiedTask.id] = processed.find(t => t.id === modifiedTask.id) || modifiedTask;
      Object.values(newDirty).forEach(task => updateTask(task));
      updateDependencies(collectAllDependencies(processed));
    } else {
      setTasks(processed);
    }
  };
  // Ref to capture editTask before it's cleared
  const editTaskRef = useRef<GanttChartViewTask | null>(null);
  editTaskRef.current = editTask;

  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const { selectedProjectId } = useProject();

  // ── Load data from DB ──────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && user && selectedProjectId) {
      fetchBudgetAndSyncGantt();
    }
  }, [user, authLoading, selectedProjectId]);

  const fetchBudgetAndSyncGantt = async () => {
    if (!user || !selectedProjectId) return;
    setIsLoading(true);
    try {
      const { data: budgetLevels, error: budgetError } = await (supabase.from('orcamentos') as any)
        .select(`
          id,
          atividade_principal,
          orcamento_atividades (
            id,
            descricao,
            ordem,
            custo_total
          )
        `)
        .eq('project_id', selectedProjectId);

      if (budgetError) throw budgetError;

      const allSecondaryIds = budgetLevels?.flatMap((level: any) => 
        level.orcamento_atividades.map((act: any) => act.id)
      ) || [];

      if (allSecondaryIds.length === 0) {
        setTasks([]);
        return;
      }

      const { data: ganttPersistence, error: persistenceError } = await (supabase
        .from('gantt_atividades' as any)
        .select('*')
        .in('orcamento_atividade_id', allSecondaryIds) as any);

      if (persistenceError) throw persistenceError;

      const [executionRes, dependenciesRes] = await Promise.all([
        supabase.from('cronograma_execucoes').select('*').in('atividade_id', allSecondaryIds),
        (supabase.from('gantt_dependencies' as any).select('*').in('atividade_id', ganttPersistence?.map((p: any) => p.id) || []) as any)
      ]);

      if (executionRes.error) throw executionRes.error;
      if (dependenciesRes.error) throw dependenciesRes.error;

      const executionHistory = executionRes.data;
      const fullDependencies = dependenciesRes.data;

      const existingSecondaryIds = new Set(ganttPersistence?.map((p: any) => p.orcamento_atividade_id));
      const missingIds = allSecondaryIds.filter((id: string) => !existingSecondaryIds.has(id));

      if (missingIds.length > 0) {
        const defaultRecords = missingIds.map((id: string) => ({
          orcamento_atividade_id: id,
          data_inicio: format(new Date(), 'yyyy-MM-dd'),
          data_fim: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
          status: 'not_started',
          progresso: 0
        }));

        const { error: insertError } = await (supabase
          .from('gantt_atividades' as any)
          .insert(defaultRecords) as any);

        if (insertError) throw insertError;

        const { data: updatedPersistence, error: reFetchError } = await (supabase
          .from('gantt_atividades' as any)
          .select('*')
          .in('orcamento_atividade_id', allSecondaryIds) as any);
        
        if (reFetchError) throw reFetchError;
        processGanttData(budgetLevels, updatedPersistence, executionHistory || [], fullDependencies || []);
      } else {
        processGanttData(budgetLevels, ganttPersistence, executionHistory || [], fullDependencies || []);
      }
    } catch (error: any) {
      console.error('Error fetching Gantt data:', error);
      toast({ title: 'Erro ao carregar cronograma', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Process raw DB data into task list ──────────────────────────────────
  const processGanttData = (budgetLevels: any[], persistence: any[], executionHistory: any[], dependencies: any[]) => {
    const ganttTasks: GanttChartViewTask[] = [];
    const persistenceMap = new Map(persistence.map((p: any) => [p.orcamento_atividade_id, p]));
    const dependencyMap = new Map<string, GanttDependency[]>();
    dependencies.forEach((dep: any) => {
      if (!dependencyMap.has(dep.atividade_id)) dependencyMap.set(dep.atividade_id, []);
      dependencyMap.get(dep.atividade_id)!.push(dep);
    });

    const today = startOfDay(new Date());
    const sortedLevels = [...budgetLevels].sort((a: any, b: any) => {
      const idxA = ATIVIDADES_PRINCIPAIS.indexOf(a.atividade_principal as any);
      const idxB = ATIVIDADES_PRINCIPAIS.indexOf(b.atividade_principal as any);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });

    sortedLevels.forEach((level, levelIdx) => {
      const itemNumber = `${levelIdx + 1}`;
      const children = level.orcamento_atividades.map((act: any, actIdx: number) => {
        const p = persistenceMap.get(act.id);
        const start = p?.data_inicio || format(new Date(), 'yyyy-MM-dd');
        const end = p?.data_fim || format(addDays(new Date(), 7), 'yyyy-MM-dd');
        const progress = p?.progresso || 0;
        const endDate = parseDateSafe(end);
        const duration = getDurationDays(start, end);
        return {
          id: p?.id || act.id,
          orcamento_id: act.id,
          name: act.descricao,
          type: 'secundaria' as const,
          start,
          end,
          progress,
          status: (p?.status?.replace('_', '-') || 'not-started') as any,
          delayed: endDate < today && progress < 100,
          dependencies: p?.dependencies || [],
          fullDependencies: p ? (dependencyMap.get(p.id) || []) : [],
          cost: act.custo_total || 0,
          itemNumber: `${itemNumber}.${actIdx + 1}`,
          duration
        };
      }).sort((a: any, b: any) => a.itemNumber.localeCompare(b.itemNumber, undefined, { numeric: true }));

      if (children.length > 0) {
        const startDates = children.map((c: any) => parseDateSafe(c.start).getTime());
        const endDates = children.map((c: any) => parseDateSafe(c.end).getTime());
        const avgProgress = Math.round(children.reduce((acc: number, c: any) => acc + c.progress, 0) / children.length);
        const start = format(new Date(Math.min(...startDates)), 'yyyy-MM-dd');
        const end = format(new Date(Math.max(...endDates)), 'yyyy-MM-dd');
        ganttTasks.push({
          id: level.id,
          orcamento_id: level.id,
          name: level.atividade_principal,
          type: 'principal',
          start,
          end,
          progress: avgProgress,
          status: avgProgress === 100 ? 'completed' : avgProgress > 0 ? 'in-progress' : 'not-started',
          delayed: children.some((c: any) => c.delayed),
          dependencies: [],
          itemNumber,
          duration: getDurationDays(start, end)
        });
        ganttTasks.push(...children);
      }
    });

    // Run engine + CPM. On initial load, do NOT mark anything dirty.
    const processed = calculateCPM(calcularGantt(ganttTasks, dependencies));
    setTasks(processed);
    setDirtyTasks({}); // Clean slate on load
    setDependencies(dependencies);
    setDirtyDependencies([]);
  };

  // ── Simulation toggle ──────────────────────────────────────────────────
  const toggleSimulation = () => {
    if (simulationMode) fetchBudgetAndSyncGantt();
    setSimulationMode(!simulationMode);
  };

  // ── Open edit form ─────────────────────────────────────────────────────
  const handleEditTask = (chartTask: GanttChartViewTask) => {
    if (chartTask.type === 'principal') return;
    setEditTask(chartTask);
    setFormOpen(true);
  };

  // ── Handle form close ──────────────────────────────────────────────────
  const handleFormClose = () => {
    setFormOpen(false);
    setEditTask(null);
  };

  // ── Save dirty tasks AND their dependencies to DB ─────────────────────
  const handleSave = async () => {
    try {
      const tasksToSave = Object.values(dirtyTasks).map(task => ({
        id: task.id,
        orcamento_atividade_id: task.orcamento_id,
        data_inicio: task.start,
        data_fim: task.end,
        status: task.status.replace('-', '_'),
        progresso: task.progress,
        updated_at: new Date().toISOString()
      }));

      // DEBUG OBRIGATÓRIO (conforme instrução)
      console.log('Tasks:', tasksToSave);
      console.log('Dependencies:', dirtyDependencies);

      if (tasksToSave.length === 0 && dirtyDependencies.length === 0) {
        toast({ title: 'Tudo em dia!', description: 'Nenhuma alteração pendente para salvar.' });
        return;
      }

      setIsSaving(true);

      // salvar tarefas
      if (tasksToSave.length > 0) {
        const { error: taskError } = await (supabase
          .from('gantt_atividades' as any)
          .upsert(tasksToSave) as any);

        if (taskError) {
          console.error(taskError);
          toast({ title: 'Erro ao salvar tarefas', description: taskError.message, variant: 'destructive' });
          setIsSaving(false);
          return;
        }

        // LIMPEZA OBRIGATÓRIA: Para evitar que dependências removidas na interface
        // fiquem órfãs no banco após o upsert da nova lista.
        const dirtyTaskIds = tasksToSave.map(t => t.id);
        const { error: delError } = await (supabase
          .from('gantt_dependencies' as any)
          .delete()
          .in('atividade_id', dirtyTaskIds) as any);
          
        if (delError) console.error('Aviso ao limpar dependências:', delError);
      }

      // salvar dependências
      if (dirtyDependencies.length > 0) {
        // Garantimos que novas deps que não tinham id ganhem um
        const cleanedDeps = dirtyDependencies.map(dep => ({
          id: dep.id || crypto.randomUUID(),
          atividade_id: dep.atividade_id,
          predecessora_id: dep.predecessora_id,
          tipo: dep.tipo,
          lag: dep.lag || 0
        }));

        const { error: depError } = await (supabase
          .from('gantt_dependencies' as any)
          .upsert(cleanedDeps) as any);

        if (depError) {
          console.error(depError);
          toast({ title: 'Erro ao salvar dependências', description: depError.message, variant: 'destructive' });
          setIsSaving(false);
          return;
        }
      }

      // limpar estados
      setDirtyTasks({});
      setDirtyDependencies([]);

      toast({ title: '✅ Salvo com sucesso', description: 'Alterações salvas com sucesso' });
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Erro inesperado ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Add dependency via drag-and-drop ───────────────────────────────────
  const handleAddDependency = (taskId: string, predId: string) => {
    if (taskId === predId) return;
    if (detectaCiclo(taskId, predId, tasks)) {
      toast({ title: 'Ciclo detectado', description: 'Esta dependência criaria um ciclo infinito.', variant: 'destructive' });
      return;
    }

    // Convert to targetTask structure
    const targetTask = tasks.find(t => t.id === taskId || t.orcamento_id === taskId);
    if (!targetTask) return;

    // Prevent duplicate predecessors
    if (targetTask.fullDependencies?.some(d => d.predecessora_id === predId)) {
      toast({ title: 'Dependência duplicada', description: 'Esta predecessora já está vinculada a esta atividade.', variant: 'destructive' });
      return;
    }

    const newTask = {
      ...targetTask,
      fullDependencies: [...(targetTask.fullDependencies || []), {
        id: crypto.randomUUID(),
        atividade_id: targetTask.id,
        predecessora_id: predId,
        tipo: 'FS' as const,
        lag: 0
      }]
    };

    processUserEdit(newTask);
  };

  const saveDependencyToDb = async (taskId: string, predId: string) => {
    try {
      const { error } = await (supabase.from('gantt_dependencies' as any).insert({
        atividade_id: taskId,
        predecessora_id: predId,
        tipo: 'FS',
        lag: 0
      }) as any);
      if (error) throw error;
      toast({ title: 'Dependência adicionada', description: 'A conexão foi salva com sucesso.' });
    } catch (e: any) {
      toast({ title: 'Erro ao salvar dependência', description: e.message, variant: 'destructive' });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  if (authLoading) return <AppLayout><div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#a2632a]"></div></div></AppLayout>;
  if (!user) return <AppLayout><div className="text-center py-12"><p className="text-lg text-gray-600">Logue para ver o cronograma.</p></div></AppLayout>;

  const hasDirtyTasks = Object.keys(dirtyTasks).length > 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-playfair font-bold text-white tracking-tight">Gantt Profissional</h2>
            <p className="text-[#d6d6d6] font-lato text-sm uppercase tracking-widest flex items-center gap-2"><span className="w-8 h-px bg-[#a2632a]" /> Planejamento de Obra</p>
          </div>
          <div className="flex items-center gap-4">
            {hasDirtyTasks && !simulationMode && (
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="bg-[#a2632a] hover:bg-[#a2632a]/90 text-white font-bold h-9 shadow-[0_0_15px_rgba(162,99,42,0.4)] animate-in fade-in zoom-in duration-300"
              >
                {isSaving ? 'Salvando...' : `Salvar Alterações (${Object.keys(dirtyTasks).length})`}
              </Button>
            )}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${simulationMode ? 'bg-[#a2632a]/20 border-[#a2632a] text-[#a2632a]' : 'bg-white/5 border-white/10 text-muted-foreground'}`}>
              <span className="text-[10px] font-bold uppercase tracking-tighter">Modo Simulação</span>
              <button onClick={toggleSimulation} className={`w-10 h-5 rounded-full relative transition-colors ${simulationMode ? 'bg-[#a2632a]' : 'bg-white/20'}`}><div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${simulationMode ? 'left-5.5' : 'left-0.5'}`} /></button>
            </div>
          </div>
        </div>
        {isLoading && tasks.length === 0 ? (
          <div className="flex items-center justify-center py-24 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a2632a]"></div>
              <p className="text-sm text-muted-foreground animate-pulse font-lato uppercase tracking-widest">Sincronizando dados...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 relative">
            {isLoading && (
              <div className="absolute top-2 right-2 z-50">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#a2632a]"></div>
              </div>
            )}
            <GanttChartView tasks={tasks} onEditTask={handleEditTask} viewStartDate={viewStartDate} viewEndDate={viewEndDate} onTimeRangeChange={(s, e) => { setViewStartDate(s); setViewEndDate(e); }} onAddDependency={handleAddDependency} />
            <SCurveChart data={sCurveData} />
          </div>
        )}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="sm:max-w-[600px] bg-[#1a1f16] border-border/40">
            <DialogHeader><DialogTitle className="text-[#a2632a]">Dados da Atividade</DialogTitle></DialogHeader>
            {editTask && <GanttTaskForm task={editTask} allTasks={tasks.filter(t => t.type === 'secundaria' && t.orcamento_id !== editTask.orcamento_id)} onClose={handleFormClose} simulationMode={simulationMode} updateTask={processUserEdit} />}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default GanttChart;
