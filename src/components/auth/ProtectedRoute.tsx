
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole, AppRole } from '@/hooks/useUserRole';
import { useProject } from '@/contexts/ProjectContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: AppRole[];
  requiredPermission?: { module: string; action: string };
  bannedProjectRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children,
  requiredRoles = [],
  requiredPermission,
  bannedProjectRoles,
}) => {
  const { user, isLoading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { hasPermission, currentRole } = useProject();
  const location = useLocation();

  if (authLoading || roleLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-balix-accent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRoles.length > 0 && role) {
    if (!requiredRoles.includes(role)) {
      return <Navigate to="/" replace />;
    }
  }

  // Check permission-based access (admins bypass)
  if (requiredPermission && role !== 'admin') {
    if (!hasPermission(requiredPermission.module, requiredPermission.action)) {
      return <Navigate to="/" replace />;
    }
  }

  // Check banned project roles (redirect backward or root)
  if (bannedProjectRoles && bannedProjectRoles.length > 0 && currentRole?.role_nome) {
    if (bannedProjectRoles.includes(currentRole.role_nome)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
