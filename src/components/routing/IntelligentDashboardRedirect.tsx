import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { dashboardRouter } from '@/utils/intelligentDashboardRouter';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, User } from 'lucide-react';

interface IntelligentDashboardRedirectProps {
  children?: React.ReactNode;
  fallbackRoute?: string;
  showLoadingMessage?: boolean;
}

/**
 * Intelligent Dashboard Redirect Component
 * Automatically redirects users to their role-specific dashboard
 */
export const IntelligentDashboardRedirect: React.FC<IntelligentDashboardRedirectProps> = ({
  children,
  fallbackRoute = '/login',
  showLoadingMessage = true
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        setLoading(true);
        setError(null);

        // Handle generic dashboard routes
        await dashboardRouter.handleGenericDashboardRedirect(location.pathname, navigate);

        // Get user role info
        const roleInfo = await dashboardRouter.getUserRoleInfo();

        if (!roleInfo.isAuthenticated) {
          console.log('❌ User not authenticated, redirecting to:', fallbackRoute);
          navigate(fallbackRoute, { replace: true });
          return;
        }

        if (roleInfo.error) {
          setError(roleInfo.error);
        }

        // Navigate to appropriate dashboard
        await dashboardRouter.navigateToRoleDashboard(navigate, {
          fallbackRoute,
          onError: setError
        });

      } catch (err) {
        console.error('❌ Error in IntelligentDashboardRedirect:', err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    handleRedirect();
  }, [navigate, location.pathname, fallbackRoute]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          {showLoadingMessage && (
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">
                Setting up your dashboard...
              </h2>
              <p className="text-gray-600">
                Detecting your account type and preparing your personalized experience
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Dashboard Setup Error:</strong> {error}
              <br />
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 text-red-600 underline hover:text-red-800"
              >
                Try again
              </button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Role-Based Dashboard Guard
 * Protects routes and redirects to appropriate dashboard if user doesn't have access
 */
export const RoleBasedDashboardGuard: React.FC<{
  children: React.ReactNode;
  requiredRole?: string;
  allowedRoles?: string[];
}> = ({ children, requiredRole, allowedRoles = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setLoading(true);
        
        const roleInfo = await dashboardRouter.getUserRoleInfo();
        
        if (!roleInfo.isAuthenticated) {
          navigate('/login', { replace: true });
          return;
        }

        const userRole = roleInfo.role;
        let access = false;

        if (requiredRole) {
          access = userRole === requiredRole;
        } else if (allowedRoles.length > 0) {
          access = allowedRoles.includes(userRole || '');
        } else {
          access = true; // No restrictions
        }

        if (!access) {
          console.log(`❌ Access denied. User role: ${userRole}, Required: ${requiredRole || allowedRoles.join(', ')}`);
          // Redirect to appropriate dashboard instead of showing error
          await dashboardRouter.navigateToRoleDashboard(navigate);
          return;
        }

        setHasAccess(access);
      } catch (error) {
        console.error('❌ Error in RoleBasedDashboardGuard:', error);
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [navigate, requiredRole, allowedRoles, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600">Verifying access permissions...</p>
        </div>
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Redirecting to your dashboard...
          </h2>
          <p className="text-gray-600">
            You don't have access to this page. Taking you to your personalized dashboard.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};