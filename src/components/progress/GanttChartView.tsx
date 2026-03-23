import React, { useState, useMemo } from 'react';
import { GanttChartViewTask } from '@/types/progress';
import { 
  format, 
  addDays, 
  eachDayOfInterval, 
  differenceInDays, 
  startOfDay, 
  endOfDay,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  addMonths
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Edit } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GanttChartViewProps {
  tasks: GanttChartViewTask[];
  onEditTask: (task: GanttChartViewTask) => void;
  viewStartDate: Date;
  viewEndDate: Date;
  onTimeRangeChange: (start: Date, end: Date) => void;
  onAddDependency: (taskId: string, predId: string) => void;
}

type ViewMode = 'days' | 'weeks' | 'months';

const GanttChartView: React.FC<GanttChartViewProps> = ({ 
  tasks, 
  onEditTask,
  viewStartDate,
  viewEndDate,
  onTimeRangeChange,
  onAddDependency
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('days');
  const [dragSource, setDragSource] = useState<{ id: string, x: number, y: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dragTargetId, setDragTargetId] = useState<string | null>(null);
  
  // Column Widths Persistence
  const [colWidths, setColWidths] = useState(() => {
    const saved = localStorage.getItem('gantt_column_widths');
    if (saved) return JSON.parse(saved);
    return {
      item: 40,
      name: 180,
      duration: 50,
      start: 75,
      end: 75,
      predecessors: 80
    };
  });

  const saveWidths = (newWidths: any) => {
    setColWidths(newWidths);
    localStorage.setItem('gantt_column_widths', JSON.stringify(newWidths));
  };

  const sidebarWidth = Object.values(colWidths).reduce((a: any, b: any) => a + b, 0) as number;
  const taskRowHeight = 44;
  const headerHeight = 64;

  const columnWidth = useMemo(() => {
    switch (viewMode) {
      case 'days': return 36;
      case 'weeks': return 60;
      case 'months': return 120;
    }
  }, [viewMode]);

  const periods = useMemo(() => {
    const start = startOfDay(viewStartDate);
    const end = endOfDay(viewEndDate);
    if (viewMode === 'days') return eachDayOfInterval({ start, end });
    if (viewMode === 'weeks') return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
    if (viewMode === 'months') return eachMonthOfInterval({ start, end });
    return [];
  }, [viewStartDate, viewEndDate, viewMode]);

  const chartWidth = sidebarWidth + (periods.length * columnWidth);

  const getTaskPosition = (task: GanttChartViewTask) => {
    const taskStart = startOfDay(new Date(task.start));
    const taskEnd = endOfDay(new Date(task.end));
    const viewStart = startOfDay(viewStartDate);
    
    const msPerColumn = {
      days: 86400000,
      weeks: 86400000 * 7,
      months: 86400000 * 30.44
    }[viewMode];

    const offsetMs = taskStart.getTime() - viewStart.getTime();
    const durationMs = taskEnd.getTime() - taskStart.getTime();

    const left = sidebarWidth + (offsetMs / msPerColumn) * columnWidth;
    const width = (durationMs / msPerColumn) * columnWidth;

    // Calculate visual offset for FS dependencies with same date (MS Project visual style)
    let visualOffset = 0;
    if (task.fullDependencies) {
      const hasFSOnSameDay = task.fullDependencies.some(dep => {
        if (dep.tipo !== 'FS') return false;
        const pred = tasks.find(t => t.orcamento_id === dep.predecessora_id || t.id === dep.predecessora_id);
        if (!pred) return false;
        
        const taskStart = format(new Date(task.start), 'yyyy-MM-dd');
        const predEnd = format(new Date(pred.end), 'yyyy-MM-dd');
        return taskStart === predEnd;
      });
      if (hasFSOnSameDay) visualOffset = 4; // 4px offset as requested
    }

    return { left, width: Math.max(width, 4), visualOffset };
  };

  const getPredecessorsString = (task: GanttChartViewTask) => {
    if (!task.fullDependencies || task.fullDependencies.length === 0) return '-';
    return task.fullDependencies.map(dep => {
      const pred = tasks.find(t => t.orcamento_id === dep.predecessora_id || t.id === dep.predecessora_id);
      if (!pred) return '';
      const typeStr = dep.tipo === 'FS' ? '' : dep.tipo;
      const lagStr = dep.lag > 0 ? `+${dep.lag}d` : dep.lag < 0 ? `${dep.lag}d` : '';
      return `${pred.itemNumber}${typeStr}${lagStr}`;
    }).filter(Boolean).join(', ');
  };

  const todayPos = useMemo(() => {
    const today = startOfDay(new Date());
    const viewStart = startOfDay(viewStartDate);
    const msPerColumn = {
      days: 86400000,
      weeks: 86400000 * 7,
      months: 86400000 * 30.44
    }[viewMode];

    if (today < viewStart || today > viewEndDate) return null;

    return sidebarWidth + ((today.getTime() - viewStart.getTime()) / msPerColumn) * columnWidth;
  }, [viewStartDate, viewEndDate, viewMode, columnWidth, sidebarWidth]);

  const getStatusColor = (task: GanttChartViewTask) => {
    if (task.status === 'completed') return 'bg-[#4CAF50]';
    if (task.is_critical || task.delayed) return 'bg-[#E53935]';
    if (task.status === 'in-progress') return 'bg-[#a2632a]';
    return 'bg-white/10 ring-1 ring-white/20 ring-inset';
  };

  const handleNavigate = (direction: number) => {
    const step = direction * (viewMode === 'months' ? 1 : 14);
    if (viewMode === 'months') {
      onTimeRangeChange(addMonths(viewStartDate, direction), addMonths(viewEndDate, direction));
    } else {
      onTimeRangeChange(addDays(viewStartDate, step), addDays(viewEndDate, step));
    }
  };

  const onResize = (id: string, width: number) => {
    saveWidths({ ...colWidths, [id]: Math.max(width, 20) });
  };

  function eachWeekOfInterval({ start, end }: { start: Date, end: Date }, options: { weekStartsOn: 1 }) {
    const weeks = [];
    let current = start;
    while (current <= end) {
      weeks.push(current);
      current = addDays(current, 7);
    }
    return weeks;
  }

  const handleDragStart = (e: React.MouseEvent, task: GanttChartViewTask) => {
    if (task.type === 'principal') return;
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const svgRect = document.getElementById('gantt-svg-layer')?.getBoundingClientRect();
    if (!svgRect) return;

    setDragSource({ 
      id: task.orcamento_id || task.id, 
      x: rect.right - svgRect.left, 
      y: (rect.top + rect.bottom) / 2 - svgRect.top 
    });
    setMousePos({ 
      x: e.clientX - svgRect.left, 
      y: e.clientY - svgRect.top 
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragSource) return;
    const svgRect = document.getElementById('gantt-svg-layer')?.getBoundingClientRect();
    if (!svgRect) return;
    setMousePos({ 
      x: e.clientX - svgRect.left, 
      y: e.clientY - svgRect.top 
    });
  };

  const handleMouseUp = () => {
    if (dragSource && dragTargetId && dragSource.id !== dragTargetId) {
      onAddDependency(dragTargetId, dragSource.id);
    }
    setDragSource(null);
    setDragTargetId(null);
  };

  return (
    <div 
      className="flex flex-col bg-card rounded-xl border border-border/40 shadow-2xl overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-secondary/20 border-b border-border/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
            {['days', 'weeks', 'months'].map((mode) => (
              <Button 
                key={mode}
                variant="ghost" 
                size="sm" 
                onClick={() => setViewMode(mode as ViewMode)}
                className={`h-7 px-3 text-xs ${viewMode === mode ? 'bg-[#a2632a] text-white shadow-lg' : 'text-muted-foreground'}`}
              >
                {mode === 'days' ? 'Dias' : mode === 'weeks' ? 'Semanas' : 'Meses'}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-lato text-muted-foreground bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
            {format(viewStartDate, 'dd/MM/yyyy')} - {format(viewEndDate, 'dd/MM/yyyy')}
          </span>
          <div className="flex space-x-1">
            <Button variant="outline" size="sm" onClick={() => handleNavigate(-1)} className="border-border/60 hover:bg-white/5 text-balix-light h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleNavigate(1)} className="border-border/60 hover:bg-white/5 text-balix-light h-8 w-8 p-0">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto relative custom-scrollbar">
        <div style={{ width: chartWidth, minWidth: '100%' }}>
          <div className="flex sticky top-0 z-20 border-b border-border/40 bg-secondary/90 backdrop-blur-md" style={{ height: headerHeight }}>
            <div className="flex flex-shrink-0 border-r border-border/40 bg-secondary/50 font-playfair font-bold text-white text-[10px] uppercase tracking-wider h-full" style={{ width: sidebarWidth }}>
              {[
                { id: 'item', label: 'Item' },
                { id: 'name', label: 'Atividade / Cronograma' },
                { id: 'duration', label: 'Dur.' },
                { id: 'start', label: 'Início' },
                { id: 'end', label: 'Fim' },
                { id: 'predecessors', label: 'Predec.' }
              ].map((col) => (
                <div 
                  key={col.id} 
                  className="relative flex items-center px-2 border-r border-border/20 last:border-r-0"
                  style={{ width: colWidths[col.id as keyof typeof colWidths] }}
                >
                  <span className="truncate">{col.label}</span>
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#a2632a]/50"
                    onMouseDown={(e) => {
                      const startX = e.pageX;
                      const startWidth = colWidths[col.id as keyof typeof colWidths];
                      const onMouseMove = (moveEvent: MouseEvent) => {
                        onResize(col.id, startWidth + (moveEvent.pageX - startX));
                      };
                      const onMouseUp = () => {
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                      };
                      document.addEventListener('mousemove', onMouseMove);
                      document.addEventListener('mouseup', onMouseUp);
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col flex-1">
              <div className="flex border-b border-border/20 h-1/2">
                {eachMonthOfInterval({ start: viewStartDate, end: viewEndDate }).map((month, i, arr) => {
                  const daysInMonth = differenceInDays(
                    i === arr.length - 1 ? viewEndDate : endOfMonth(month),
                    i === 0 ? viewStartDate : startOfMonth(month)
                  ) + 1;
                  const monthWidth = (daysInMonth / (viewMode === 'weeks' ? 7 : viewMode === 'months' ? 30.44 : 1)) * columnWidth;
                  return (
                    <div key={i} className="border-r border-border/20 flex items-center justify-center text-[10px] text-white/60 font-medium uppercase truncate" style={{ width: monthWidth }}>
                      {format(month, 'MMMM yyyy', { locale: ptBR })}
                    </div>
                  );
                })}
              </div>
              <div className="flex h-1/2">
                {periods.map((period, index) => (
                  <div 
                    key={index} 
                    className={`flex-shrink-0 border-l border-border/10 flex flex-col items-center justify-center text-[9px] font-bold ${viewMode === 'days' && (period.getDay() === 0 || period.getDay() === 6) ? 'bg-white/5' : ''}`}
                    style={{ width: columnWidth }}
                  >
                    <span className="text-white/80">{viewMode === 'days' ? format(period, 'dd') : viewMode === 'weeks' ? `S${format(period, 'w')}` : format(period, 'MMM')}</span>
                    {viewMode === 'days' && <span className="text-white/40 uppercase font-normal">{format(period, 'EE', { locale: ptBR }).slice(0, 1)}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {todayPos && (
            <div className="absolute top-0 bottom-0 w-px bg-[#E53935] z-10 pointer-events-none" style={{ left: todayPos }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#E53935] text-[9px] text-white px-1 font-bold rounded-b">HOJE</div>
            </div>
          )}

          <svg 
            id="gantt-svg-layer"
            className="absolute top-[64px] pointer-events-none z-0" 
            style={{ left: sidebarWidth, width: chartWidth - sidebarWidth, height: tasks.length * taskRowHeight }}
          >
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.7)" />
              </marker>
              <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#a2632a" />
              </marker>
            </defs>
            {tasks.map((task, taskIndex) => {
              if (task.type === 'principal' || !task.fullDependencies) return null;
              const { left: taskLeft, width: taskWidth } = getTaskPosition(task);
              const yTask = taskIndex * taskRowHeight + (taskRowHeight / 2);
              return task.fullDependencies.map((dep, depIndex) => {
                const predIndex = tasks.findIndex(t => t.orcamento_id === dep.predecessora_id || t.id === dep.predecessora_id);
                if (predIndex === -1) return null;
                const pred = tasks[predIndex];
                const { left: predLeft, width: predWidth } = getTaskPosition(pred);
                const yPred = predIndex * taskRowHeight + (taskRowHeight / 2);

                // MS Project L-shaped path: horizontal → vertical → horizontal
                let startX: number, endX: number;
                
                // Start point: right side for FS/FF, left side for SS/SF
                if (dep.tipo === 'FS' || dep.tipo === 'FF') {
                  startX = predLeft - sidebarWidth + predWidth;
                } else {
                  startX = predLeft - sidebarWidth;
                }
                
                // End point: left side for FS/SS, right side for FF/SF
                if (dep.tipo === 'FS' || dep.tipo === 'SS') {
                  endX = taskLeft - sidebarWidth;
                } else {
                  endX = taskLeft - sidebarWidth + taskWidth;
                }

                // L-shaped path: go right from predecessor, then down, then to successor
                const gap = 8; // px offset from bars
                const midX = startX + gap;
                
                const path = yPred === yTask
                  ? `M ${startX} ${yPred} L ${endX} ${yTask}` // Same row: straight line
                  : `M ${startX} ${yPred} L ${midX} ${yPred} L ${midX} ${yTask} L ${endX} ${yTask}`; // L-shape

                const strokeColor = task.is_critical ? "rgba(229,57,51,0.5)" : "rgba(255,255,255,0.4)";

                return (
                  <path
                    key={`${task.id}-dep-${depIndex}`}
                    d={path}
                    fill="none" 
                    stroke={strokeColor}
                    strokeWidth="2" 
                    markerEnd="url(#arrowhead)"
                  />
                );
              });
            })}
            {dragSource && (
              <path 
                d={`M ${dragSource.x} ${dragSource.y} L ${mousePos.x} ${mousePos.y}`}
                fill="none" stroke="#a2632a" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrowhead-active)"
              />
            )}
          </svg>

          <div className="absolute top-[64px] bottom-0 right-0 pointer-events-none flex" style={{ left: sidebarWidth }}>
            {periods.map((_, i) => (
              <div 
                key={i} 
                className={`flex-shrink-0 border-l border-border/5 h-full`} 
                style={{ width: columnWidth }} 
              />
            ))}
            <div className="border-l border-border/5 h-full" />
          </div>
          
          <div className="bg-transparent relative">
            {tasks.map((task, index) => {
              const { left, width, visualOffset } = getTaskPosition(task);
              const isPrincipal = task.type === 'principal';
              const isDragTarget = dragTargetId === (task.orcamento_id || task.id);
              
              return (
                <div 
                  key={`${task.id}-${index}`} 
                  className={`flex relative group hover:bg-white/5 transition-colors border-b border-border/10 ${isPrincipal ? 'bg-secondary/40' : 'bg-transparent'}`}
                  style={{ height: taskRowHeight }}
                  onMouseEnter={() => !isPrincipal && dragSource && setDragTargetId(task.orcamento_id || task.id)}
                  onMouseLeave={() => dragTargetId === (task.orcamento_id || task.id) && setDragTargetId(null)}
                >
                  <div className="flex flex-shrink-0 border-r border-border/40 z-10 font-lato text-[11px]" style={{ width: sidebarWidth }}>
                    <div className="flex items-center px-2 border-r border-border/10 text-white/40 font-bold" style={{ width: colWidths.item }}>{task.itemNumber}</div>
                    <div className="flex items-center px-2 border-r border-border/10 justify-between group/name overflow-hidden" style={{ width: colWidths.name }}>
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isPrincipal ? 'bg-[#a2632a]' : 'bg-white/20'}`} />
                        <span className={`truncate ${isPrincipal ? 'font-bold text-white uppercase text-[10px]' : 'text-balix-light/80'}`}>{task.name}</span>
                      </div>
                      {task.type === 'secundaria' && (
                        <Button 
                          variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#a2632a]/20 text-[#a2632a] flex-shrink-0"
                          onClick={() => onEditTask(task)}
                        ><Edit className="h-3.5 w-3.5" /></Button>
                      )}
                    </div>
                    <div className="flex items-center px-2 border-r border-border/10 justify-center text-white/60" style={{ width: colWidths.duration }}>{task.duration}d</div>
                    <div className="flex items-center px-2 border-r border-border/10 justify-center text-white/60" style={{ width: colWidths.start }}>{format(new Date(task.start), 'dd/MM/yy')}</div>
                    <div className="flex items-center px-2 border-r border-border/10 justify-center text-white/60" style={{ width: colWidths.end }}>{format(new Date(task.end), 'dd/MM/yy')}</div>
                    <div className="flex items-center px-2 text-white/40 truncate text-[10px]" style={{ width: colWidths.predecessors }}>{getPredecessorsString(task)}</div>
                  </div>
                  
                  <div className="flex-1 relative overflow-hidden" style={{ minWidth: periods.length * columnWidth }}>
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`absolute top-3 h-[18px] rounded-[6px] shadow-[0_2px_8px_rgba(0,0,0,0.4)] ${getStatusColor(task)} flex items-center 
                              ${isPrincipal ? 'cursor-default h-[12px] top-[15px]' : 'cursor-pointer hover:brightness-110'} transition-all
                              ${isDragTarget ? 'ring-2 ring-[#a2632a] ring-offset-2 ring-offset-[#1a1f16]' : ''}`}
                            style={{ 
                              left: left - sidebarWidth, 
                              width,
                              transform: visualOffset ? `translateX(${visualOffset}px)` : undefined
                            }}
                            onMouseDown={(e) => handleDragStart(e, task)}
                            onClick={() => !isPrincipal && !dragSource && onEditTask(task)}
                          >
                            <div className="h-full bg-white/30 rounded-l-[6px]" style={{ width: `${task.progress}%` }} />
                            {width > 40 && <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-black drop-shadow-md">{task.progress}%</span>}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-secondary border border-border/60 text-white shadow-2xl z-50">
                          <div className="p-2 space-y-2 min-w-[180px]">
                            <p className="font-playfair font-bold border-b border-border/40 pb-1 text-[#a2632a]">{task.name}</p>
                            <p className="text-[10px] text-white/60">Arraste para criar dependência</p>
                            <div className="grid grid-cols-2 gap-y-1 text-[11px] font-lato">
                              <span className="text-muted-foreground">Início:</span><span className="text-right">{format(new Date(task.start), 'dd/MM/yyyy')}</span>
                              <span className="text-muted-foreground">Término:</span><span className="text-right">{format(new Date(task.end), 'dd/MM/yyyy')}</span>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChartView;
