import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardRoute, isPublicRoute } from '@/utils/navigationHelpers';

interface StandardizedBackButtonProps {
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fallbackPath?: string;
  showText?: boolean;
  customText?: string;
}

// Context-aware fallback routes based on current page
const CONTEXT_FALLBACKS: Record<string, string> = {
  '/client/profile': '/client-dashboard',
  '/client/jobs': '/client-dashboard',
  '/client/payment-history': '/client-dashboard',
  '/landscaper/profile': '/landscaper-dashboard',
  '/landscaper-profile': '/landscaper-dashboard',
  '/landscaper/jobs': '/landscaper-dashboard',
  '/landscaper-jobs': '/landscaper-dashboard',
  '/landscaper/earnings': '/landscaper-dashboard',
  '/admin/profile': '/admin-dashboard',
  '/admin/notifications': '/admin-dashboard',
  '/thank-you': '/get-quote',
  '/reset-password': '/portal-login',
  '/forgot-password': '/portal-login',
};

// Auth-aware fallbacks that return dashboard instead of public routes
const getAuthAwareFallback = (currentPath: string, role: string | null): string => {
  const contextFallback = CONTEXT_FALLBACKS[currentPath];
  
  if (contextFallback) {
    // If the fallback is a public route and user is authenticated, go to dashboard
    if (isPublicRoute(contextFallback)) {
      return getDashboardRoute(role);
    }
    return contextFallback;
  }
  
  // Default to dashboard for authenticated users
  return getDashboardRoute(role);
};

export default function StandardizedBackButton({ 
  className = '',
  variant = 'ghost',
  size = 'sm',
  fallbackPath,
  showText = true,
  customText = 'Back'
}: StandardizedBackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role } = useAuth();
  
  const isAuthenticated = !!user;

  const handleBack = () => {
    // Priority 1: Use explicit fallbackPath if provided
    if (fallbackPath) {
      // Even with explicit fallback, don't allow authenticated users to go to public routes
      if (isAuthenticated && isPublicRoute(fallbackPath)) {
        navigate(getDashboardRoute(role));
        return;
      }
      navigate(fallbackPath);
      return;
    }

    const currentPath = location.pathname;

    // Priority 2: For authenticated users, use auth-aware navigation
    if (isAuthenticated) {
      const safeFallback = getAuthAwareFallback(currentPath, role);
      navigate(safeFallback);
      return;
    }

    // Priority 3: For unauthenticated users, try browser history
    const hasHistory = window.history.length > 2;
    
    if (hasHistory) {
      navigate(-1);
      return;
    }

    // Priority 4: Use context-aware fallback for unauthenticated users
    const contextFallback = CONTEXT_FALLBACKS[currentPath];
    if (contextFallback) {
      navigate(contextFallback);
      return;
    }

    // Priority 5: Universal fallback to home page
    navigate('/');
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const baseClasses = `
    flex items-center gap-2 text-emerald-400 hover:text-emerald-300 
    hover:bg-emerald-500/10 border border-emerald-500/30 
    hover:border-emerald-400/50 transition-all duration-300
    backdrop-blur-sm bg-gray-900/20 shadow-lg shadow-emerald-500/10
    hover:shadow-emerald-400/20 ${sizeClasses[size]} ${className}
  `;

  return (
    <Button
      onClick={handleBack}
      variant={variant}
      className={baseClasses}
    >
      <ArrowLeft className="h-4 w-4" />
      {showText && <span className="font-medium">{customText}</span>}
    </Button>
  );
}
