import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  Area, 
  ComposedChart 
} from 'recharts';
import { Card } from '@/components/ui/card';
import { TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SCurveChartProps {
  data: any[];
}

const SCurveChart: React.FC<SCurveChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const latest = data.filter(d => d.realizado !== null).pop() || { planejado: 0, realizado: 0 };
  const totalPlanned = data[data.length - 1]?.planejado || 1;
  
  const percPlanned = Math.round((latest.planejado / totalPlanned) * 100);
  const percActual = Math.round((latest.realizado / totalPlanned) * 100);
  const deviation = percActual - percPlanned;

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

  return (
    <Card className="p-6 bg-card border-border/40 shadow-2xl overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h3 className="text-xl font-playfair font-bold text-white flex items-center gap-2">
            <TrendingUp className="text-[#a2632a] h-5 w-5" />
            Curva S - Avanço Físico-Financeiro
          </h3>
          <p className="text-sm text-muted-foreground font-lato">Comparativo entre o planejado acumulado e o progresso real da obra</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-3">
            <div className={`p-2 rounded-lg ${deviation >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
              {deviation >= 0 ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Desvio</p>
              <p className={`text-lg font-black ${deviation >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {deviation > 0 ? '+' : ''}{deviation}%
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full bg-white/20" />
              <span className="text-muted-foreground">Planejado:</span>
              <span className="font-bold text-white">{percPlanned}%</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full bg-[#a2632a]" />
              <span className="text-muted-foreground">Realizado:</span>
              <span className="font-bold text-white">{percActual}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="colorPlanejado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="rgba(255,255,255,0.1)" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="rgba(255,255,255,0)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="rgba(255,255,255,0.3)" 
              fontSize={10} 
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.3)" 
              fontSize={10} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `R$${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#fff'
              }}
              formatter={(value: number) => [formatCurrency(value), '']}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            
            <Area 
              type="monotone" 
              dataKey="planejado" 
              name="Planejado Acumulado"
              stroke="rgba(255,255,255,0.2)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorPlanejado)" 
            />
            
            <Line 
              type="monotone" 
              dataKey="realizado" 
              name="Realizado Acumulado"
              stroke="#a2632a" 
              strokeWidth={4} 
              dot={{ r: 4, fill: '#a2632a', strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default SCurveChart;
