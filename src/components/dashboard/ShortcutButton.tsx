
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
        'flex flex-col items-center justify-center h-auto py-10 w-full bg-white/[0.02] border border-white/[0.08] rounded-[16px] shadow-[0_6px_24px_rgba(0,0,0,0.25)] backdrop-blur-[6px] transition-all duration-300 hover:translate-y-[-2px] hover:bg-white/[0.05] hover:border-[#a2632a]/30 group',
        className
      )}
    >
      <div className="p-4 rounded-xl bg-[#a2632a]/10 mb-5 group-hover:bg-[#a2632a]/20 transition-colors">
        <div className="text-[#a2632a]">
          {renderIcon()}
        </div>
      </div>
      <span className="text-[14px] font-bold tracking-[0.5px] text-white/90 group-hover:text-white transition-colors text-center px-2 leading-tight break-words uppercase">
        {label}
      </span>
      {description && (
        <span className="text-[11px] text-white/40 mt-2 font-medium group-hover:text-white/60 transition-colors text-center px-4">
          {description}
        </span>
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
