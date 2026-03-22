
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
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  className,
  valueClassName,
  trend,
  onClick,
}) => {
  const getIcon = () => {
    const iconClass = "h-5 w-5 text-[#a2632a]";
    switch (icon) {
      case 'chart-bar':
        return <BarChart2 className={iconClass} />;
      case 'trending-up':
        return <TrendingUp className={iconClass} />;
      case 'trending-down':
        return <TrendingDown className={iconClass} />;
      case 'dollar-sign':
        return <DollarSign className={iconClass} />;
      case 'users':
        return <Users className={iconClass} />;
      case 'file-text':
        return <FileText className={iconClass} />;
      case 'calendar':
        return <Calendar className={iconClass} />;
      default:
        return <BarChart2 className={iconClass} />;
    }
  };

  return (
    <Card 
      className={cn(
        'bg-white/[0.02] border border-white/[0.08] rounded-[16px] shadow-[0_6px_24px_rgba(0,0,0,0.25)] backdrop-blur-[6px] transition-all duration-300 hover:translate-y-[-2px] h-full overflow-hidden',
        className, 
        onClick && "cursor-pointer active:scale-[0.98]"
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-[14px] font-medium tracking-[0.3px] text-white/60">{title}</CardTitle>
        <div className="p-2 bg-[#a2632a]/10 rounded-xl">
          {getIcon()}
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold text-white/90 font-playfair", valueClassName)}>{value}</div>
        {description && (
          <p className="text-[13px] text-white/50 mt-1 font-medium">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-3 bg-white/[0.03] w-fit px-2 py-1 rounded-md">
            <span
              className={cn(
                'text-xs font-bold leading-none',
                trend.isPositive ? 'text-green-500' : 'text-orange-500'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
            <span className="text-[10px] text-white/40 ml-1.5 uppercase font-bold tracking-tighter">vs mês ant.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
