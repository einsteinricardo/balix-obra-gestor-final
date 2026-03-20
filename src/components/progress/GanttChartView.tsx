
import React, { useState } from 'react';
import { GanttTask } from '@/types/progress';
import { format, addDays, eachDayOfInterval, differenceInDays, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Edit } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GanttChartViewTask {
  id: string;
  stage: string;
  start: string;
  end: string;
  progress: number;
  status: 'not-started' | 'in-progress' | 'completed';
}

interface GanttChartViewProps {
  tasks: GanttChartViewTask[];
  onEditTask: (task: GanttChartViewTask) => void;
  viewStartDate: Date;
  viewEndDate: Date;
  onTimeRangeChange: (start: Date, end: Date) => void;
}

const GanttChartView: React.FC<GanttChartViewProps> = ({ 
  tasks, 
  onEditTask,
  viewStartDate,
  viewEndDate,
  onTimeRangeChange
}) => {
  const taskHeight = 50;
  const headerHeight = 50;
  
  // Number of days to display
  const days = eachDayOfInterval({ start: viewStartDate, end: viewEndDate });
  const totalDays = days.length;
  
  // Calculate column width based on container width and number of days
  const columnWidth = 40; // fixed width for each day column
  
  // Chart width calculation
  const chartWidth = (columnWidth * totalDays) + 200; // 200px for the task names column
  
  const getTaskBarPosition = (task: GanttChartViewTask) => {
    const startDate = new Date(task.start);
    const endDate = new Date(task.end);
    
    // Calculate days from viewStartDate
    const startOffset = Math.max(0, differenceInDays(startDate, viewStartDate));
    const taskDuration = Math.max(1, differenceInDays(endDate, startDate) + 1);
    
    // Calculate position and width
    const left = 200 + (startOffset * columnWidth);
    const width = taskDuration * columnWidth;
    
    return { left, width };
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      default:
        return 'bg-gray-300';
    }
  };
  
  const getStageLabel = (stage: string): string => {
    const stageMap: Record<string, string> = {
      'foundation': 'Fundação',
      'structure': 'Estrutura',
      'masonry': 'Alvenaria',
      'roofing': 'Cobertura',
      'electrical': 'Elétrica',
      'plumbing': 'Hidráulica',
      'finishing': 'Acabamento',
      'landscaping': 'Paisagismo',
      'other': 'Outro'
    };
    
    return stageMap[stage] || stage;
  };
  
  const handleNavigateBack = () => {
    const newStart = addDays(viewStartDate, -Math.floor(totalDays / 2));
    const newEnd = addDays(viewEndDate, -Math.floor(totalDays / 2));
    onTimeRangeChange(newStart, newEnd);
  };
  
  const handleNavigateForward = () => {
    const newStart = addDays(viewStartDate, Math.floor(totalDays / 2));
    const newEnd = addDays(viewEndDate, Math.floor(totalDays / 2));
    onTimeRangeChange(newStart, newEnd);
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-between mb-4">
        <div>
          <p className="font-medium">Período de visualização</p>
          <p className="text-sm text-muted-foreground">
            {format(viewStartDate, 'dd/MM/yyyy')} - {format(viewEndDate, 'dd/MM/yyyy')}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleNavigateBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          <Button variant="outline" size="sm" onClick={handleNavigateForward}>
            Próximo <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
      
      <div 
        className="relative border rounded-lg" 
        style={{ 
          width: '100%', 
          minWidth: Math.min(chartWidth, 1200),
          overflowX: 'auto'
        }}
      >
        {/* Header with dates */}
        <div className="flex" style={{ height: headerHeight }}>
          {/* Task name column */}
          <div className="flex-shrink-0 w-[200px] border-r bg-muted/50 p-2 font-medium">
            Etapa
          </div>
          
          {/* Date columns */}
          <div className="flex">
            {days.map((day, index) => (
              <div 
                key={index} 
                className={`
                  flex-shrink-0 border-r text-center py-2 text-xs
                  ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-muted/30' : 'bg-muted/10'}
                `}
                style={{ width: columnWidth }}
              >
                <div>{format(day, 'dd')}</div>
                <div className="text-muted-foreground">{format(day, 'MMM', { locale: ptBR }).slice(0, 3)}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Tasks rows */}
        <div>
          {tasks.map((task, index) => (
            <div 
              key={task.id} 
              className={`flex relative ${index < tasks.length - 1 ? 'border-b' : ''}`}
              style={{ height: taskHeight }}
            >
              {/* Task name */}
              <div className="flex-shrink-0 w-[200px] border-r p-2 flex items-center justify-between">
                <span className="truncate text-sm">{getStageLabel(task.stage)}</span>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onEditTask(task)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Timeline grid */}
              <div className="flex relative" style={{ height: taskHeight }}>
                {days.map((day, i) => (
                  <div
                    key={i}
                    className={`
                      flex-shrink-0 border-r
                      ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-muted/30' : ''}
                    `}
                    style={{ width: columnWidth, height: taskHeight }}
                  />
                ))}
                
                {/* Task bar */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`absolute top-2 h-[calc(100%-16px)] rounded-md ${getStatusColor(task.status)} flex items-center justify-center cursor-pointer`}
                        style={{ 
                          ...getTaskBarPosition(task),
                          transition: 'all 0.3s ease' 
                        }}
                        onClick={() => onEditTask(task)}
                      >
                        <span className="text-xs text-white font-medium px-2 truncate">
                          {task.progress}%
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <p className="font-medium">{getStageLabel(task.stage)}</p>
                        <p>Início: {format(new Date(task.start), 'dd/MM/yyyy')}</p>
                        <p>Fim: {format(new Date(task.end), 'dd/MM/yyyy')}</p>
                        <p>Progresso: {task.progress}%</p>
                        <p>Status: {task.status === 'completed' ? 'Concluída' : task.status === 'in-progress' ? 'Em andamento' : 'Não iniciada'}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="border-t p-2 flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-300 rounded-sm mr-2"></div>
            <span className="text-xs">Não iniciada</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-sm mr-2"></div>
            <span className="text-xs">Em andamento</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded-sm mr-2"></div>
            <span className="text-xs">Concluída</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChartView;
