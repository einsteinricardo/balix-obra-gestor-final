
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  BarChart2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Users,
  FileText,
  Calendar
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: string;
  className?: string;
  valueClassName?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  className,
  valueClassName,
  trend,
}) => {
  const getIcon = () => {
    switch (icon) {
      case 'chart-bar':
        return <BarChart2 className="h-4 w-4" />;
      case 'trending-up':
        return <TrendingUp className="h-4 w-4" />;
      case 'trending-down':
        return <TrendingDown className="h-4 w-4" />;
      case 'dollar-sign':
        return <DollarSign className="h-4 w-4" />;
      case 'users':
        return <Users className="h-4 w-4" />;
      case 'file-text':
        return <FileText className="h-4 w-4" />;
      case 'calendar':
        return <Calendar className="h-4 w-4" />;
      default:
        return <BarChart2 className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn('card-stats', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-normal text-muted-foreground">{title}</CardTitle>
        <div className="p-1.5 bg-balix-accent/10 rounded-full">
          {getIcon()}
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold text-white", valueClassName)}>{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <span
              className={cn(
                'text-xs',
                trend.isPositive ? 'text-green-500' : 'text-red-500'
              )}
            >
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">desde o mês passado</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
