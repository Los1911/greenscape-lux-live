import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Home, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardRoute, isPublicRoute } from '@/utils/navigationHelpers';

interface GlobalNavigationProps {
  showBack?: boolean;
  showHome?: boolean;
  showClose?: boolean;
  customBackPath?: string;
  onClose?: () => void;
  className?: string;
}

// Auth-aware fallback routes based on current page
const AUTH_BACK_ROUTES: Record<string, (role: string | null) => string> = {
  // Quote flow - authenticated users go to dashboard
  '/get-quote': (role) => getDashboardRoute(role),
  '/get-a-quote': (role) => getDashboardRoute(role),
  '/instant-quote': (role) => getDashboardRoute(role),
  '/thank-you': () => '/get-quote',
  
  // Client routes
  '/client/profile': () => '/client-dashboard',
  '/client/jobs': () => '/client-dashboard',
  '/client/payment-history': () => '/client-dashboard',
  '/profile': () => '/client-dashboard',
  '/client-history': () => '/client-dashboard',
  '/billing/history': () => '/client-dashboard',
  '/subscriptions': () => '/client-dashboard',
  '/chat': () => '/client-dashboard',
  '/payments/overview': () => '/client-dashboard',
  '/payments/methods': () => '/client-dashboard',
  '/payments/subscriptions': () => '/client-dashboard',
  '/payments/security': () => '/client-dashboard',
  
  // Landscaper routes
  '/landscaper/profile': () => '/landscaper-dashboard',
  '/landscaper-profile': () => '/landscaper-dashboard',
  '/landscaper/jobs': () => '/landscaper-dashboard',
  '/landscaper-jobs': () => '/landscaper-dashboard',
  '/landscaper/earnings': () => '/landscaper-dashboard',
  '/new-requests': () => '/landscaper-dashboard',
  
  // Admin routes
  '/admin/profile': () => '/admin-dashboard',
  '/admin/notifications': () => '/admin-dashboard',
  '/admin': () => '/admin-dashboard',
  '/business-automation': () => '/admin-dashboard',
  '/notifications': () => '/admin-dashboard',
  '/ai-quotes': () => '/admin-dashboard',
  '/analytics/pricing': () => '/admin-dashboard',
  
  // Auth pages - authenticated users go to their dashboard
  '/portal-login': (role) => getDashboardRoute(role),
  '/reset-password': (role) => getDashboardRoute(role),
  '/get-started': (role) => getDashboardRoute(role),
};

// Fallback routes for unauthenticated users
const UNAUTH_BACK_ROUTES: Record<string, string> = {
  '/get-quote': '/',
  '/thank-you': '/get-quote',
  '/portal-login': '/',
  '/reset-password': '/portal-login',
  '/get-started': '/',
  '/about': '/',
  '/professionals': '/',
  '/privacy': '/',
  '/terms': '/',
};

const GlobalNavigation: React.FC<GlobalNavigationProps> = ({
  showBack = true,
  showHome = true,
  showClose = false,
  customBackPath,
  onClose,
  className = ""
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role } = useAuth();
  
  const isAuthenticated = !!user;

  const handleBack = () => {
    // Use custom path if provided
    if (customBackPath) {
      // Even with custom path, don't allow authenticated users to go to public routes
      if (isAuthenticated && isPublicRoute(customBackPath)) {
        navigate(getDashboardRoute(role));
        return;
      }
      navigate(customBackPath);
      return;
    }
    
    const currentPath = location.pathname;
    
    // For authenticated users, use auth-aware navigation
    if (isAuthenticated) {
      const authBackFn = AUTH_BACK_ROUTES[currentPath];
      if (authBackFn) {
        navigate(authBackFn(role));
        return;
      }
      
      // Default to dashboard for authenticated users
      navigate(getDashboardRoute(role));
      return;
    }
    
    // For unauthenticated users, use standard back routes
    const unauthBack = UNAUTH_BACK_ROUTES[currentPath];
    if (unauthBack) {
      navigate(unauthBack);
      return;
    }
    
    // Fallback to home for unauthenticated users
    navigate('/');
  };

  const handleHome = () => {
    // For authenticated users, "Home" means their dashboard
    if (isAuthenticated) {
      navigate(getDashboardRoute(role));
    } else {
      navigate('/');
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // For authenticated users, close goes to dashboard
      if (isAuthenticated) {
        navigate(getDashboardRoute(role));
      } else {
        navigate('/');
      }
    }
  };

  // Don't show on home page (for unauthenticated users)
  // For authenticated users, don't show on their dashboard
  if (!isAuthenticated && location.pathname === '/') {
    return null;
  }
  
  if (isAuthenticated && location.pathname === getDashboardRoute(role)) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showBack && (
        <Button
          variant="ghost"
          onClick={handleBack}
          className="text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      )}
      
      {showHome && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleHome}
          className="text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Home className="w-4 h-4 mr-1" />
          {isAuthenticated ? 'Dashboard' : 'Home'}
        </Button>
      )}

      {showClose && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <X className="w-4 h-4 mr-1" />
          Close
        </Button>
      )}
    </div>
  );
};

export default GlobalNavigation;
