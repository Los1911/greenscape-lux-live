import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (import.meta.env.DEV) {
    console.log('=== ADMIN PROTECTED ROUTE DEBUG ===');
    console.log('🔍 User:', user?.email);
    console.log('🎭 Role:', role);
    console.log('⏳ Loading:', loading);
    console.log('🔐 Is Admin?', role === 'admin');
    console.log('✨ Is admin.1@greenscapelux.com?', user?.email === 'admin.1@greenscapelux.com');
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

  // TEMPORARY ADMIN OVERRIDE - Safe unblock for admin.1@greenscapelux.com
  if (user.email === 'admin.1@greenscapelux.com') {
    if (import.meta.env.DEV) {
      console.log('🔐 ADMIN_PROTECTED_ROUTE OVERRIDE: Granting access for admin.1@greenscapelux.com');
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