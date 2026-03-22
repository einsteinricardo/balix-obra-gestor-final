import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface IntelligentProgressProps {
  progress: number;
  expectedTotalCost: number;
}

import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { TrendingUp, Wallet } from 'lucide-react';

const IntelligentProgress: React.FC<IntelligentProgressProps> = ({ progress, expectedTotalCost }) => {
  const data = [
    { name: 'Progress', value: progress },
    { name: 'Remaining', value: 100 - progress },
  ];
  
  const COLORS = ['#a2632a', 'rgba(255, 255, 255, 0.05)'];

  return (
    <Card className="bg-white/[0.02] border border-white/[0.08] rounded-[16px] shadow-[0_6px_24px_rgba(0,0,0,0.25)] backdrop-blur-[6px] transition-all duration-300 hover:translate-y-[-2px] h-full flex flex-col relative overflow-visible">
      {/* Top Header - Immersive Positioning */}
      <div className="absolute top-5 left-6 z-20">
        <div className="flex items-center gap-2 mb-0.5">
          <TrendingUp className="h-5 w-5 text-[#a2632a]" />
          <h3 className="text-[18px] font-semibold tracking-[0.3px] text-white/90 font-playfair">
            Progresso Real
          </h3>
        </div>
        <p className="text-[12px] text-white/60 font-medium italic">Ponderado por custo e execução</p>
      </div>

      <CardContent className="pt-10 pb-2 px-6 sm:px-8 flex flex-col h-full items-center justify-center gap-4">
        {/* Main Gauge Area - Ultimate Immersive Coverage */}
        <div className="w-[98%] max-w-[640px] aspect-[2/1] flex items-end justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={data}
                cx="50%"
                cy="100%"
                startAngle={180}
                endAngle={0}
                innerRadius="55%"
                outerRadius="100%"
                paddingAngle={0}
                dataKey="value"
                stroke="none"
                isAnimationActive={true}
                animationDuration={1500}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Value Display - Refined Typography Harmony */}
        <div className="flex flex-col items-center justify-center gap-0.5">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-[48px] font-semibold font-playfair tracking-normal text-white/95 leading-none">
              {progress}
            </span>
            <span className="text-[24px] font-bold text-[#a2632a] opacity-80">%</span>
          </div>
          <span className="text-[14px] font-medium text-white/60">
            Obra Concluída
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
export default IntelligentProgress;
