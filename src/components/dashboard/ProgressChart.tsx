
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProgressChartProps {
  data: {
    name: string;
    previsto: number;
    realizado: number;
  }[];
  title: string;
}

const defaultData = [
  { name: 'Jan', previsto: 65, realizado: 40 },
  { name: 'Fev', previsto: 50, realizado: 30 },
  { name: 'Mar', previsto: 75, realizado: 60 },
  { name: 'Abr', previsto: 90, realizado: 70 },
  { name: 'Mai', previsto: 100, realizado: 80 },
];

const ProgressChart: React.FC<ProgressChartProps> = ({ 
  data = defaultData, 
  title = "Progresso da Obra (%)" 
}) => {
  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle className="text-lg font-playfair">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#f5f5f5', fontSize: 12 }}
                tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis 
                tick={{ fill: '#f5f5f5', fontSize: 12 }}
                tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2812', 
                  borderColor: '#a76429',
                  color: '#f5f5f5',
                  borderRadius: '0.5rem'
                }}
              />
              <Bar dataKey="previsto" fill="#475031" radius={[4, 4, 0, 0]} />
              <Bar dataKey="realizado" fill="#a76429" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressChart;
