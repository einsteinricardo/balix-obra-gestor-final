
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-balix-accent"></div>
      </div>
    );
  }

  // If user is authenticated, redirect to home
  if (user) {
    return <Navigate to="/" replace />;
  }

  // If not authenticated, render the public content
  return <>{children}</>;
};

export default PublicRoute;
