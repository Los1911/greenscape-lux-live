import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardRouter } from '@/utils/intelligentDashboardRouter';

interface SimpleProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'client' | 'landscaper' | 'admin';
}

export default function SimpleProtectedRoute({ 
  children, 
  requiredRole 
}: SimpleProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle automatic redirection for role mismatches
  useEffect(() => {
    if (!loading && user && role && requiredRole && role !== requiredRole) {
      console.log(`🔄 Role mismatch detected. User role: ${role}, Required: ${requiredRole}`);
      // Use intelligent router to redirect to appropriate dashboard
      dashboardRouter.navigateToRoleDashboard(navigate, { replace: true });
    }
  }, [loading, user, role, requiredRole, navigate]);

  if (import.meta.env.DEV) {
    console.log('SimpleProtectedRoute DEBUG:', { 
      user: !!user, 
      userId: user?.id, 
      role, 
      loading, 
      requiredRole,
      currentPath: location.pathname,
      timestamp: new Date().toISOString()
    });
  }

  // Show loading spinner while auth is being determined
  if (loading) {
    if (import.meta.env.DEV) {
      console.log('Auth still loading, showing spinner');
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900" role="status" aria-label="Loading authentication">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  // If no user, redirect to appropriate login
  if (!user) {
    if (import.meta.env.DEV) {
      console.log('No user found, redirecting to login');
    }
    const loginUrl = requiredRole === 'admin' 
      ? '/admin-login' 
      : requiredRole === 'landscaper' 
        ? '/pro-login' 
        : '/client-login';
    return <Navigate to={loginUrl} replace />;
  }

  // If user exists but no role yet, wait a bit more
  if (!role) {
    if (import.meta.env.DEV) {
      console.log('User exists but no role yet, waiting...');
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900" role="status" aria-label="Loading user role">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  // If role doesn't match required role, the useEffect will handle redirection
  // Show loading while redirect is happening
  if (requiredRole && role !== requiredRole) {
    if (import.meta.env.DEV) {
      console.log('Role mismatch - redirecting to appropriate dashboard:', { requiredRole, actualRole: role });
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center text-white max-w-md mx-auto px-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Redirecting...</h2>
          <p className="text-gray-300 mb-4">Taking you to your dashboard</p>
          <p className="text-sm text-gray-400">Your role: {role}</p>
        </div>
      </div>
    );
  }

  if (import.meta.env.DEV) {
    console.log('All checks passed, rendering children');
  }
  return <>{children}</>;
}