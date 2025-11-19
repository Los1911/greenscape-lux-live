// Navigation helper utilities for consistent UX
import { NavigateFunction } from 'react-router-dom';
import { useRole } from '@/hooks/useRole';

// Route mapping for proper back navigation
export const BACK_ROUTE_MAP: Record<string, string> = {
  '/get-quote': '/',
  '/get-a-quote': '/',
  '/instant-quote': '/',
  '/thank-you': '/get-quote',

  // Auth flows
  '/login': '/',
  '/signup': '/',
  '/client-login': '/',
  '/client-signup': '/',
  '/landscaper-login': '/',
  '/landscaper-signup': '/',
  '/pro-login': '/',
  '/pro-signup': '/',
  '/get-started': '/',
  '/forgot-password': '/client-login',
  '/reset-password': '/client-login',

  // Dashboards
  '/client/dashboard': '/',
  '/client/profile': '/client/dashboard',
  '/landscaper/dashboard': '/',
  '/landscaper-dashboard': '/',
  '/landscaper/profile': '/landscaper/dashboard',
  '/landscaper-profile': '/landscaper-dashboard',
  '/landscaper/jobs': '/landscaper/dashboard',
  '/landscaper-jobs': '/landscaper-dashboard',

  // Admin
  '/admin': '/',
  '/admin/profile': '/admin',
  '/admin/notifications': '/admin',

  // Misc
  '/about': '/',
  '/professionals': '/',
  '/privacy': '/',
  '/terms': '/',
  '/search': '/',
};

// Simple back navigation
export const navigateBack = (navigate: NavigateFunction, currentPath: string) => {
  const backPath = BACK_ROUTE_MAP[currentPath] || '/';
  navigate(backPath);
};

// Context aware back navigation (updated to use useRole instead of getUserRoles)
export const navigateBackContextAware = (
  navigate: NavigateFunction,
  currentPath: string
): void => {
  const { role, loading } = useRole();

  if (loading) {
    const backPath = BACK_ROUTE_MAP[currentPath] || '/';
    navigate(backPath);
    return;
  }

  const dashboardRoute = getDashboardRoute(role || undefined);

  if (
    currentPath.includes('/profile') ||
    currentPath.includes('/jobs') ||
    currentPath.includes('/earnings') ||
    currentPath.includes('/chat') ||
    currentPath.includes('/notifications')
  ) {
    navigate(dashboardRoute);
    return;
  }

  if (currentPath === dashboardRoute) {
    navigate('/');
    return;
  }

  const backPath = BACK_ROUTE_MAP[currentPath] || dashboardRoute;
  navigate(backPath);
};

// Helper wrapper
export const createNavigationHelper = (navigate: NavigateFunction, location: any) => ({
  goBack: (fallbackPath?: string) => {
    const currentPath = location.pathname;
    const backPath = fallbackPath || BACK_ROUTE_MAP[currentPath] || '/';
    navigate(backPath);
  },

  goToDashboard: (userRole?: string) => {
    navigate(getDashboardRoute(userRole));
  },

  goToProfile: (userRole?: string) => {
    navigate(getProfileRoute(userRole));
  },

  goHome: () => navigate('/'),
  goToQuote: () => navigate('/get-quote'),
  goToAuth: (type: 'login' | 'signup' = 'login') => navigate(`/${type}`),
});

// Role-based routing
export const getDashboardRoute = (userRole?: string): string => {
  switch (userRole) {
    case 'admin':
      return '/admin-dashboard';
    case 'landscaper':
      return '/landscaper-dashboard';
    case 'client':
      return '/client-dashboard';
    default:
      return '/';
  }
};

export const getProfileRoute = (userRole?: string): string => {
  switch (userRole) {
    case 'admin':
      return '/admin/profile';
    case 'landscaper':
      return '/landscaper-profile';
    case 'client':
      return '/client/profile';
    default:
      return '/login';
  }
};