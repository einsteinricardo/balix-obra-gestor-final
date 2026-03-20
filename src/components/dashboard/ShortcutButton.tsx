
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { 
  BarChart2, 
  FilePlus, 
  FileText, 
  DollarSign,
  Book,
  LucideIcon
} from 'lucide-react';

interface ShortcutButtonProps {
  icon: string | React.ReactNode;
  label: string;
  description?: string;
  to?: string;
  onClick?: () => void;
  className?: string;
}

const ShortcutButton: React.FC<ShortcutButtonProps> = ({
  icon,
  label,
  description,
  to,
  onClick,
  className,
}) => {
  // Render the icon based on string value or use the provided ReactNode
  const renderIcon = () => {
    if (typeof icon === 'string') {
      switch (icon) {
        case 'file-plus':
          return <FilePlus size={20} />;
        case 'file-text':
          return <FileText size={20} />;
        case 'dollar-sign':
          return <DollarSign size={20} />;
        case 'bar-chart-2':
          return <BarChart2 size={20} />;
        case 'book':
          return <Book size={20} />;
        default:
          return <FileText size={20} />;
      }
    }
    return icon;
  };

  const content = (
    <Button
      variant="outline"
      className={cn(
        'flex flex-col items-center justify-center h-auto py-6 w-full border-border/50 bg-secondary/50 hover:bg-secondary hover:border-balix-accent/50',
        className
      )}
    >
      <div className="p-3 rounded-full bg-balix-accent/10 mb-3">
        {renderIcon()}
      </div>
      <span className="text-sm font-medium">{label}</span>
      {description && (
        <span className="text-xs text-muted-foreground mt-1">{description}</span>
      )}
    </Button>
  );

  // If we have an onClick handler, use a button, otherwise use a Link
  if (onClick) {
    return <div onClick={onClick} className="block cursor-pointer">{content}</div>;
  }

  // If we have a to prop, use a Link
  if (to) {
    return <Link to={to} className="block">{content}</Link>;
  }

  // Fallback to just rendering the content
  return <div className="block">{content}</div>;
};

export default ShortcutButton;
