import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Shield, AlertTriangle } from 'lucide-react';
import { getDashboardRoute } from '@/utils/navigationHelpers';

interface AdminSecurityGateProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export default function AdminSecurityGate({ 
  children, 
  requireSuperAdmin = false 
}: AdminSecurityGateProps) {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const verifyAdminAccess = async () => {
      if (!user || role !== 'admin') {
        setVerifying(false);
        return;
      }

      try {
        // Verify admin status in database
        const { data, error } = await supabase
          .from('users')
          .select('role, is_super_admin')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        const authorized = data.role === 'admin';
        const superAdmin = data.is_super_admin === true;

        setIsAuthorized(authorized);
        setIsSuperAdmin(superAdmin);

        // Log admin access
        if (authorized) {
          await supabase.from('admin_login_logs').insert({
            admin_id: user.id,
            email: user.email,
            ip_address: 'browser',
            user_agent: navigator.userAgent,
            success: true
          });
        }
      } catch (error) {
        console.error('Admin verification failed:', error);
        setIsAuthorized(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyAdminAccess();
  }, [user, role]);

  // Auth-aware back navigation for admin users
  const handleGoBack = () => {
    // Admin users should go to admin dashboard, not public pages
    navigate(getDashboardRoute(role));
  };

  if (loading || verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4 animate-pulse" />
          <LoadingSpinner />
          <p className="text-gray-400 mt-4">Verifying admin credentials...</p>
        </div>
      </div>
    );
  }

  if (!user || role !== 'admin' || !isAuthorized) {
    return <Navigate to="/admin-login" replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="max-w-md w-full bg-gray-800 border border-red-500/30 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <h2 className="text-xl font-bold text-red-400">Access Denied</h2>
          </div>
          <p className="text-gray-300 mb-4">
            This area requires super admin privileges. Please contact a system administrator.
          </p>
          <button
            onClick={handleGoBack}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
