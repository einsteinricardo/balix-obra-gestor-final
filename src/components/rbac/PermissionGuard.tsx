import React from 'react';
import { useProject } from '@/contexts/ProjectContext';

interface PermissionGuardProps {
  children: React.ReactNode;
  module: string;
  action: string;
  obraId?: string | null;
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children based on RBAC permissions from ProjectContext.
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  module,
  action,
  fallback = null,
}) => {
  const { hasPermission, permissionsLoading } = useProject();

  if (permissionsLoading) return null;

  if (!hasPermission(module, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGuard;
