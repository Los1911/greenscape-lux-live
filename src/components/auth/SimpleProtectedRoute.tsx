import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardRouter } from '@/utils/intelligentDashboardRouter';
import { 
  shouldEnforcePasswordReset, 
  getPasswordResetRedirectUrl 
} from '@/utils/passwordResetGuard';

interface SimpleProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'client' | 'landscaper' | 'admin';
}

/**
 * SimpleProtectedRoute - Protects routes based on authentication and role
 * 
 * NOTE: Client onboarding is handled by OnboardingGuard which wraps ClientDashboardV2.
 * This component does NOT check onboarding status - the Guard is the sole authority.
 */
export default function SimpleProtectedRoute({ 
  children, 
  requiredRole 
}: SimpleProtectedRouteProps) {
  const { user, role, loading, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);
  const [roleTimeout, setRoleTimeout] = useState(false);
  const [passwordResetRequired, setPasswordResetRequired] = useState(false);

  // Check for password reset enforcement
  useEffect(() => {
    if (!loading && session) {
      const needsPasswordReset = shouldEnforcePasswordReset(session);
      
      if (needsPasswordReset) {
        console.log('[SimpleProtectedRoute] Password reset required - blocking access');
        setPasswordResetRequired(true);
      } else {
        setPasswordResetRequired(false);
      }
    }
  }, [loading, session]);

  // Timeout for role loading - prevents infinite spinner (1.5s for fast recovery)
  useEffect(() => {
    if (!loading && user && !role && !roleTimeout) {
      const timer = setTimeout(() => {
        console.warn('[SimpleProtectedRoute] Role timeout - proceeding without role');
        setRoleTimeout(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loading, user, role, roleTimeout]);

  // Handle role mismatch redirect
  useEffect(() => {
    if (!loading && user && role && requiredRole && role !== requiredRole && !hasRedirected.current && !passwordResetRequired) {
      hasRedirected.current = true;
      console.log(`[SimpleProtectedRoute] Role mismatch: ${role} vs ${requiredRole}`);
      dashboardRouter.navigateToRoleDashboard(navigate, { replace: true });
    }
  }, [loading, user, role, requiredRole, navigate, passwordResetRequired]);

  // Loading state - show spinner with consistent styling
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-[#020b06] to-black">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-emerald-400/70 text-sm mt-3">Loading...</p>
        </div>
      </div>
    );
  }

  // No user - redirect to login
  if (!user) {
    const loginUrl = requiredRole === 'admin' ? '/admin-login' : '/portal-login';
    return <Navigate to={loginUrl} replace />;
  }

  // PASSWORD RESET ENFORCEMENT: Block access if recovery session is active
  if (passwordResetRequired) {
    console.log('[SimpleProtectedRoute] Redirecting to password reset page');
    return <Navigate to={getPasswordResetRedirectUrl()} replace state={{ from: location }} />;
  }

  // Waiting for role (not timed out yet)
  if (!role && !roleTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-[#020b06] to-black">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-emerald-400/70 text-sm mt-3">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Role mismatch - show redirect message
  if (requiredRole && role && role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-[#020b06] to-black">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-emerald-400/70 text-sm mt-3">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  // Success - render children immediately
  // NOTE: For client routes, OnboardingGuard handles onboarding checks
  return <>{children}</>;
}
