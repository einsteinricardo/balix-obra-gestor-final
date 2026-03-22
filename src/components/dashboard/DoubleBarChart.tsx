import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface DoubleBarChartProps {
  data: { name: string; entradas: number; saidas: number }[];
  title: string;
}

import { BarChart2 } from 'lucide-react';

const DoubleBarChart: React.FC<DoubleBarChartProps> = ({ data, title }) => {
  return (
    <Card className="h-full bg-white/[0.02] border border-white/[0.08] rounded-[16px] shadow-[0_6px_24px_rgba(0,0,0,0.25)] backdrop-blur-[6px] transition-all duration-300 hover:translate-y-[-2px] flex flex-col pt-1 overflow-hidden">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="text-[18px] font-semibold tracking-[0.3px] text-white/90 font-playfair flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-[#a2632a]" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4 min-h-[300px]">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="white" strokeOpacity={0.1} />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                dx={-10}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)', opacity: 0.4 }}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  backgroundColor: 'rgba(15,15,15,0.9)',
                  backdropFilter: 'blur(10px)',
                  color: 'white'
                }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                formatter={(value: number, name: string) => {
                  const color = name === "Entradas" ? "#35431d" : "#a2632a";
                  return [
                    <span style={{ color }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}</span>,
                    <span style={{ color }}>{name}</span>
                  ];
                }}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingTop: '0px', paddingBottom: '20px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }} />
              <Bar dataKey="entradas" name="Entradas" fill="#35431d" radius={[4, 4, 0, 0]} maxBarSize={35} />
              <Bar dataKey="saidas" name="Saídas" fill="#a2632a" radius={[4, 4, 0, 0]} maxBarSize={35} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-white/40 bg-white/[0.02] rounded-xl border border-dashed border-white/10">
            Nenhuma transação financeira registrada.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DoubleBarChart;
