import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  shouldEnforcePasswordReset, 
  getPasswordResetRedirectUrl 
} from '@/utils/passwordResetGuard';

// Admin email allowlist - users with these emails get admin access
const ADMIN_EMAILS = [
  'admin.1@greenscapelux.com',
  'bgreen@greenscapelux.com'
];

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, role, loading, session } = useAuth();
  const location = useLocation();
  const [passwordResetRequired, setPasswordResetRequired] = useState(false);

  // Check for password reset enforcement
  useEffect(() => {
    if (!loading && session) {
      const needsPasswordReset = shouldEnforcePasswordReset(session);
      
      if (needsPasswordReset) {
        console.log('[AdminProtectedRoute] Password reset required - blocking access');
        setPasswordResetRequired(true);
      } else {
        setPasswordResetRequired(false);
      }
    }
  }, [loading, session]);

  const isAdminEmail = user?.email && ADMIN_EMAILS.includes(user.email);

  if (import.meta.env.DEV) {
    console.log('=== ADMIN PROTECTED ROUTE DEBUG ===');
    console.log('🔍 User:', user?.email);
    console.log('🎭 Role:', role);
    console.log('⏳ Loading:', loading);
    console.log('🔐 Is Admin?', role === 'admin');
    console.log('✨ Is Admin Email?', isAdminEmail);
    console.log('🔒 Password Reset Required:', passwordResetRequired);
    console.log('=====================================');
  }


  // Show loading spinner while auth is loading OR role is not resolved yet
  if (loading || (user && role === null)) {
    if (import.meta.env.DEV) {
      console.log('⏳ AdminProtectedRoute: Still loading or role not resolved, showing spinner');
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  // If no user, redirect to admin login
  if (!user) {
    if (import.meta.env.DEV) {
      console.log('❌ AdminProtectedRoute: No user, redirecting to /admin-login');
    }
    return <Navigate to="/admin-login" replace />;
  }

  // PASSWORD RESET ENFORCEMENT: Block access if recovery session is active
  if (passwordResetRequired) {
    if (import.meta.env.DEV) {
      console.log('🔒 AdminProtectedRoute: Password reset required, redirecting to /reset-password');
    }
    return <Navigate to={getPasswordResetRedirectUrl()} replace state={{ from: location }} />;
  }

  // ADMIN EMAIL OVERRIDE - Grant access for allowlisted admin emails
  if (isAdminEmail) {
    if (import.meta.env.DEV) {
      console.log('🔐 ADMIN_PROTECTED_ROUTE OVERRIDE: Granting access for', user.email);
    }
    return <>{children}</>;
  }


  // Check role after loading is complete
  if (role !== 'admin') {
    if (import.meta.env.DEV) {
      console.log('❌ AdminProtectedRoute: Role is not admin, redirecting to /client-dashboard');
      console.log('Current role:', role);
    }
    return <Navigate to="/client-dashboard" replace />;
  }

  if (import.meta.env.DEV) {
    console.log('✅ AdminProtectedRoute: Access granted to admin dashboard');
  }

  return <>{children}</>;
}
