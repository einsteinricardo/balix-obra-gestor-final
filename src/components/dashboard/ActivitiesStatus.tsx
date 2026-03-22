import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ActivityStatus } from '@/hooks/useAdvancedDashboardData';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActivitiesStatusProps {
  activities: ActivityStatus[];
}

const ActivitiesStatus: React.FC<ActivitiesStatusProps> = ({ activities }) => {
  const [startIndex, setStartIndex] = useState(0);
  const itemsPerPage = 5;

  if (!activities || activities.length === 0) {
    return (
      <Card className="h-full bg-white/[0.02] border border-white/[0.08] rounded-[16px] shadow-[0_6px_24px_rgba(0,0,0,0.25)] backdrop-blur-[6px] transition-all duration-300 hover:translate-y-[-2px] flex flex-col pt-2 overflow-hidden">
        <CardHeader className="pb-4 flex-shrink-0">
          <CardTitle className="text-[18px] font-semibold tracking-[0.3px] text-white/90 font-playfair">Principais Etapas</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center min-h-[300px] pt-0">
          <div className="text-sm text-white/40 text-center border border-dashed rounded-xl border-white/10 p-12 w-full">
            Nenhuma atividade vinculada ao orçamento foi encontrada.
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleNext = () => {
    if (startIndex + itemsPerPage < activities.length) {
      setStartIndex(prev => prev + itemsPerPage);
    }
  };

  const handlePrev = () => {
    if (startIndex - itemsPerPage >= 0) {
      setStartIndex(prev => prev - itemsPerPage);
    } else {
      setStartIndex(0);
    }
  };

  const displayActivities = activities.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Card className="h-full bg-white/[0.02] border border-white/[0.08] rounded-[16px] shadow-[0_6px_24px_rgba(0,0,0,0.25)] backdrop-blur-[6px] transition-all duration-300 hover:translate-y-[-2px] flex flex-col group overflow-hidden pt-2">
      <CardHeader className="pb-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[18px] font-semibold tracking-[0.3px] text-white/90 font-playfair flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-[#a2632a]" /> Status das Etapas
            </CardTitle>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 mr-1">
                {startIndex + 1}-{Math.min(startIndex + itemsPerPage, activities.length)} de {activities.length}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 rounded-full bg-white/[0.03] hover:bg-[#a2632a]/20 hover:text-[#a2632a] text-white/60"
                onClick={handlePrev}
                disabled={startIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 rounded-full bg-white/[0.03] hover:bg-[#a2632a]/20 hover:text-[#a2632a] text-white/60"
                onClick={handleNext}
                disabled={startIndex + itemsPerPage >= activities.length}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-7 pt-0 pb-8 min-h-[300px]">
        {displayActivities.map((activity) => {
          let colorClass = 'bg-red-500';
          if (activity.statusVisual === 'verde') colorClass = 'bg-green-500';
          else if (activity.statusVisual === 'amarelo') colorClass = 'bg-[#a2632a]';

          return (
            <div key={activity.id} className="group/item relative">
              <div className="flex justify-between items-center mb-2.5">
                <div className="flex items-center gap-3">
                  <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_8px] shadow-current transition-all", colorClass.replace('bg-', 'text-'))} />
                  <span className="text-[14px] font-semibold text-white/80 truncate max-w-[200px] sm:max-w-xs transition-colors group-hover/item:text-white">
                    {activity.nome}
                  </span>
                </div>
                <div className="text-[14px] font-bold font-playfair tracking-tighter text-white/90">{activity.progresso}%</div>
              </div>
              <Progress 
                value={activity.progresso} 
                className="h-1 bg-white/[0.05]" 
                indicatorClassName={cn(colorClass, "transition-all duration-1000 ease-out")} 
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default ActivitiesStatus;
