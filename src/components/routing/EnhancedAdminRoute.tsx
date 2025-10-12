import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import AdminSecurityGate from '@/components/admin/AdminSecurityGate';

interface EnhancedAdminRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export default function EnhancedAdminRoute({ 
  children, 
  requireSuperAdmin = false 
}: EnhancedAdminRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  if (role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminSecurityGate requireSuperAdmin={requireSuperAdmin}>
      {children}
    </AdminSecurityGate>
  );
}
