/**
 * useAuthenticatedNavigation Hook
 * 
 * Provides auth-aware navigation that ensures authenticated users
 * never get routed to public pages (like the landing page) when
 * using browser back or cancel actions.
 * 
 * RULE: Once a user is authenticated, they should NEVER be routed
 * to the public landing page unless they explicitly log out.
 */

import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Public routes that authenticated users should NOT land on via back navigation
const PUBLIC_ROUTES = [
  '/',
  '/get-started',
  '/portal-login',
  '/login',
  '/signup',
  '/client-login',
  '/client-signup',
  '/landscaper-login',
  '/landscaper-signup',
  '/pro-login',
  '/professionals',
  '/about',
];

// Routes that are allowed for all users (even authenticated)
const UNIVERSAL_ROUTES = [
  '/get-quote',
  '/thank-you',
  '/privacy',
  '/terms',
  '/reset-password',
];

/**
 * Get the default dashboard route based on user role
 */
export const getDefaultDashboardRoute = (role: string | null): string => {
  switch (role) {
    case 'admin':
      return '/admin-dashboard';
    case 'landscaper':
      return '/landscaper-dashboard';
    case 'client':
      return '/client-dashboard';
    default:
      // If no role but authenticated, default to client dashboard
      return '/client-dashboard';
  }
};

/**
 * Check if a route is a public/marketing page
 */
export const isPublicRoute = (path: string): boolean => {
  return PUBLIC_ROUTES.some(route => path === route || path.startsWith(route + '/'));
};

/**
 * Check if a route is universally accessible
 */
export const isUniversalRoute = (path: string): boolean => {
  return UNIVERSAL_ROUTES.some(route => path === route || path.startsWith(route + '/'));
};

/**
 * Context-aware fallback routes for authenticated users
 * Maps current path to appropriate back destination
 */
const AUTH_CONTEXT_FALLBACKS: Record<string, (role: string | null) => string> = {
  // Quote flow - go to dashboard for authenticated users
  '/get-quote': (role) => getDefaultDashboardRoute(role),
  '/thank-you': () => '/get-quote',
  
  // Client dashboard sub-routes
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
  
  // Landscaper dashboard sub-routes
  '/landscaper/profile': () => '/landscaper-dashboard',
  '/landscaper-profile': () => '/landscaper-dashboard',
  '/landscaper/jobs': () => '/landscaper-dashboard',
  '/landscaper-jobs': () => '/landscaper-dashboard',
  '/landscaper/earnings': () => '/landscaper-dashboard',
  '/new-requests': () => '/landscaper-dashboard',
  
  // Admin dashboard sub-routes
  '/admin/profile': () => '/admin-dashboard',
  '/admin/notifications': () => '/admin-dashboard',
  '/admin': () => '/admin-dashboard',
  '/business-automation': () => '/admin-dashboard',
  '/notifications': () => '/admin-dashboard',
  '/ai-quotes': () => '/admin-dashboard',
  '/analytics/pricing': () => '/admin-dashboard',
  '/admin/environment-status': () => '/admin-dashboard',
  
  // Auth pages - authenticated users go to their dashboard
  '/portal-login': (role) => getDefaultDashboardRoute(role),
  '/reset-password': (role) => getDefaultDashboardRoute(role),
};

interface UseAuthenticatedNavigationReturn {
  /**
   * Navigate back in a way that respects authentication state.
   * Authenticated users will never land on public pages.
   * @param customFallback Optional explicit fallback path
   */
  navigateBack: (customFallback?: string) => void;
  
  /**
   * Navigate to the user's role-appropriate dashboard
   */
  navigateToDashboard: () => void;
  
  /**
   * Check if the current user is authenticated
   */
  isAuthenticated: boolean;
  
  /**
   * Get the appropriate dashboard route for the current user
   */
  dashboardRoute: string;
  
  /**
   * Safe navigation that redirects authenticated users away from public pages
   */
  safeNavigate: (path: string) => void;
}

export function useAuthenticatedNavigation(): UseAuthenticatedNavigationReturn {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, loading } = useAuth();
  
  const isAuthenticated = !!user && !loading;
  const dashboardRoute = getDefaultDashboardRoute(role);
  
  /**
   * Navigate back with auth-awareness
   * Priority:
   * 1. Custom fallback if provided
   * 2. Context-aware fallback based on current path
   * 3. Browser history (if it won't exit to public page)
   * 4. Role-based dashboard fallback
   */
  const navigateBack = useCallback((customFallback?: string) => {
    // Priority 1: Use explicit custom fallback if provided
    if (customFallback) {
      navigate(customFallback);
      return;
    }
    
    const currentPath = location.pathname;
    
    // Priority 2: Check for context-aware fallback
    const contextFallbackFn = AUTH_CONTEXT_FALLBACKS[currentPath];
    if (contextFallbackFn) {
      const fallbackPath = contextFallbackFn(role);
      navigate(fallbackPath);
      return;
    }
    
    // Priority 3: Try browser history, but guard against public routes for authenticated users
    if (isAuthenticated) {
      // For authenticated users, we need to be careful with navigate(-1)
      // because it might take them to a public page they visited before logging in
      
      // Check if we have meaningful in-app history
      const hasHistory = window.history.length > 2;
      
      if (hasHistory) {
        // We'll use navigate(-1) but with a safety check
        // The browser will handle the navigation, and if it lands on a public page,
        // the route guards should redirect. However, to be extra safe,
        // we prefer explicit navigation for authenticated users.
        
        // For now, prefer explicit dashboard navigation for authenticated users
        // to avoid any chance of landing on public pages
        navigate(dashboardRoute);
        return;
      }
    } else {
      // For unauthenticated users, standard back navigation is fine
      const hasHistory = window.history.length > 2;
      if (hasHistory) {
        navigate(-1);
        return;
      }
    }
    
    // Priority 4: Fallback to dashboard (authenticated) or home (unauthenticated)
    if (isAuthenticated) {
      navigate(dashboardRoute);
    } else {
      navigate('/');
    }
  }, [navigate, location.pathname, role, isAuthenticated, dashboardRoute]);
  
  /**
   * Navigate directly to the user's dashboard
   */
  const navigateToDashboard = useCallback(() => {
    navigate(dashboardRoute);
  }, [navigate, dashboardRoute]);
  
  /**
   * Safe navigation that redirects authenticated users away from public pages
   */
  const safeNavigate = useCallback((path: string) => {
    // If authenticated and trying to go to a public page, redirect to dashboard
    if (isAuthenticated && isPublicRoute(path) && !isUniversalRoute(path)) {
      console.warn(`[AuthNav] Blocked navigation to public route "${path}" for authenticated user. Redirecting to dashboard.`);
      navigate(dashboardRoute);
      return;
    }
    
    navigate(path);
  }, [navigate, isAuthenticated, dashboardRoute]);
  
  return {
    navigateBack,
    navigateToDashboard,
    isAuthenticated,
    dashboardRoute,
    safeNavigate,
  };
}

export default useAuthenticatedNavigation;
