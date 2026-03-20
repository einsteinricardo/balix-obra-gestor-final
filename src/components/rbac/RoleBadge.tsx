import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Eye, Edit, Crown } from 'lucide-react';

interface RoleBadgeProps {
  roleName: string | null;
  className?: string;
}

const roleConfig: Record<string, { icon: React.ElementType; variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  'Administrador': { icon: Crown, variant: 'destructive', label: 'Acesso total' },
  'Proprietário': { icon: Crown, variant: 'destructive', label: 'Acesso total' },
  'Gestor da Obra': { icon: Shield, variant: 'default', label: 'Gestão completa' },
  'Engenheiro': { icon: Edit, variant: 'secondary', label: 'Edição parcial' },
  'Financeiro': { icon: Edit, variant: 'secondary', label: 'Edição parcial' },
  'Cliente': { icon: Eye, variant: 'outline', label: 'Visualização' },
};

const RoleBadge: React.FC<RoleBadgeProps> = ({ roleName, className }) => {
  if (!roleName) return null;

  const config = roleConfig[roleName] || { icon: Eye, variant: 'outline' as const, label: 'Visualização' };
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Badge variant={config.variant} className="flex items-center gap-1 text-xs">
        <Icon className="h-3 w-3" />
        {roleName}
      </Badge>
      <span className="text-xs text-muted-foreground hidden md:inline">{config.label}</span>
    </div>
  );
};

export default RoleBadge;
