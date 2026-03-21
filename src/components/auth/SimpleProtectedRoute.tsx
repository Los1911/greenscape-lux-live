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
 * FIX (2026-03-18): Now waits for `roleResolved` from AuthContext before
 * making any redirect decisions.  Previously, a 1.5 s timeout could fire
 * before the authoritative DB-based role resolution completed, causing
 * admins to be misrouted to /client-dashboard (and then into the
 * OnboardingGuard screen) when opening the app in incognito.
 *
 * NOTE: Client onboarding is handled by OnboardingGuard which wraps ClientDashboardV2.
 * This component does NOT check onboarding status - the Guard is the sole authority.
 */
export default function SimpleProtectedRoute({ 
  children, 
  requiredRole 
}: SimpleProtectedRouteProps) {
  const { user, role, loading, session, roleResolved } = useAuth();
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

  // ──────────────────────────────────────────────────────────────────
  // FIX (2026-03-18): Increased timeout from 1.5 s → 4 s AND the
  // timeout now checks sessionStorage for a cached role (written by
  // AuthContext on every successful resolution).  This mirrors the
  // approach already used in RoleRouter and prevents admins from
  // being mis-routed when the DB queries take longer than expected.
  // ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && user && !roleResolved && !roleTimeout) {
      const timer = setTimeout(() => {
        console.warn('[SimpleProtectedRoute] Role resolution timeout (4 s) — using fallback');
        setRoleTimeout(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [loading, user, roleResolved, roleTimeout]);

  // Handle role mismatch redirect — only after role is authoritatively resolved
  useEffect(() => {
    if (
      !loading &&
      roleResolved &&
      user &&
      role &&
      requiredRole &&
      role !== requiredRole &&
      !hasRedirected.current &&
      !passwordResetRequired
    ) {
      hasRedirected.current = true;
      console.log(`[SimpleProtectedRoute] Role mismatch: ${role} vs ${requiredRole} — redirecting`);
      dashboardRouter.navigateToRoleDashboard(navigate, { replace: true });
    }
  }, [loading, roleResolved, user, role, requiredRole, navigate, passwordResetRequired]);

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

  // ──────────────────────────────────────────────────────────────────
  // FIX (2026-03-18): Wait for roleResolved (or timeout) before
  // rendering children or checking for mismatches.  This prevents
  // the brief window where role=null could slip through and cause
  // downstream components to make wrong assumptions.
  // ──────────────────────────────────────────────────────────────────
  if (!roleResolved && !roleTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-[#020b06] to-black">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-emerald-400/70 text-sm mt-3">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If we timed out and still don't have a role, try sessionStorage fallback
  if (!role && roleTimeout) {
    let cachedRole: string | null = null;
    try {
      cachedRole = sessionStorage.getItem('user_role');
    } catch {
      // sessionStorage unavailable
    }

    // If cached role matches required role, allow through
    if (cachedRole && requiredRole && cachedRole === requiredRole) {
      console.log(`[SimpleProtectedRoute] Timeout fallback — cached role "${cachedRole}" matches required "${requiredRole}", allowing`);
      return <>{children}</>;
    }

    // If cached role exists but doesn't match, redirect to the correct dashboard
    if (cachedRole && requiredRole && cachedRole !== requiredRole) {
      console.log(`[SimpleProtectedRoute] Timeout fallback — cached role "${cachedRole}" mismatches required "${requiredRole}", redirecting`);
      const routeMap: Record<string, string> = {
        admin: '/admin-dashboard',
        landscaper: '/landscaper-dashboard',
        client: '/client-dashboard',
      };
      return <Navigate to={routeMap[cachedRole] || '/client-dashboard'} replace />;
    }

    // No cached role at all — render children and hope for the best
    console.warn('[SimpleProtectedRoute] Timeout with no cached role — rendering children');
    return <>{children}</>;
  }

  // Role mismatch - show redirect message (the useEffect above will navigate)
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

