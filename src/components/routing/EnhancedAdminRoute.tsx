import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import AdminSecurityGate from '@/components/admin/AdminSecurityGate';
import { 
  shouldEnforcePasswordReset, 
  getPasswordResetRedirectUrl 
} from '@/utils/passwordResetGuard';

interface EnhancedAdminRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export default function EnhancedAdminRoute({ 
  children, 
  requireSuperAdmin = false 
}: EnhancedAdminRouteProps) {
  const { user, role, loading, session } = useAuth();
  const location = useLocation();
  const [passwordResetRequired, setPasswordResetRequired] = useState(false);

  // Check for password reset enforcement
  useEffect(() => {
    if (!loading && session) {
      const needsPasswordReset = shouldEnforcePasswordReset(session);
      
      if (needsPasswordReset) {
        console.log('[EnhancedAdminRoute] Password reset required - blocking access');
        setPasswordResetRequired(true);
      } else {
        setPasswordResetRequired(false);
      }
    }
  }, [loading, session]);

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

  // PASSWORD RESET ENFORCEMENT: Block access if recovery session is active
  if (passwordResetRequired) {
    console.log('[EnhancedAdminRoute] Redirecting to password reset page');
    return <Navigate to={getPasswordResetRedirectUrl()} replace state={{ from: location }} />;
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
