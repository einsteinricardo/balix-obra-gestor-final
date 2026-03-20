
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LineChartProps {
  data: {
    name: string;
    previsto: number;
    realizado: number;
  }[];
  title: string;
}

const defaultData = [
  { name: 'Jan', previsto: 40, realizado: 24 },
  { name: 'Fev', previsto: 30, realizado: 13 },
  { name: 'Mar', previsto: 20, realizado: 98 },
  { name: 'Abr', previsto: 27, realizado: 39 },
  { name: 'Mai', previsto: 18, realizado: 48 },
  { name: 'Jun', previsto: 23, realizado: 38 },
  { name: 'Jul', previsto: 34, realizado: 43 },
];

const LineChart: React.FC<LineChartProps> = ({ 
  data = defaultData, 
  title = "Análise Financeira" 
}) => {
  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle className="text-lg font-playfair">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart
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
              <Line 
                type="monotone" 
                dataKey="previsto" 
                stroke="#475031" 
                strokeWidth={2}
                dot={{ fill: '#475031', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#475031' }}
              />
              <Line 
                type="monotone" 
                dataKey="realizado" 
                stroke="#a76429" 
                strokeWidth={2}
                dot={{ fill: '#a76429', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#a76429' }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default LineChart;
