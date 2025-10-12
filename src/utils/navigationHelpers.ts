// Navigation helper utilities for consistent UX
import { NavigateFunction } from 'react-router-dom';
import { getUserRoles } from '@/hooks/useRole';

// Route mapping for proper back navigation
export const BACK_ROUTE_MAP: Record<string, string> = {
  // Quote flow
  '/get-quote': '/',
  '/get-a-quote': '/',
  '/instant-quote': '/',
  '/thank-you': '/get-quote',
  
  // Auth flows - improved back navigation logic
  '/login': '/',
  '/signup': '/',
  '/client-login': '/', // Go to home instead of role selection for better UX
  '/client-signup': '/', // Go to home instead of role selection  
  '/landscaper-login': '/',
  '/landscaper-signup': '/',
  '/pro-login': '/',
  '/pro-signup': '/',
  '/get-started': '/', // Role selection goes back to home
  '/forgot-password': '/client-login', // More intuitive than generic login
  '/reset-password': '/client-login',
  // Dashboard flows
  '/client/dashboard': '/',
  '/client/profile': '/client/dashboard',
  '/landscaper/dashboard': '/',
  '/landscaper-dashboard': '/',
  '/landscaper/profile': '/landscaper/dashboard',
  '/landscaper-profile': '/landscaper-dashboard',
  '/landscaper/jobs': '/landscaper/dashboard',
  '/landscaper-jobs': '/landscaper-dashboard',
  
  // Admin flows
  '/admin': '/',
  '/admin/profile': '/admin',
  '/admin/notifications': '/admin',
  
  // Other pages
  '/about': '/',
  '/professionals': '/',
  '/privacy': '/',
  '/terms': '/',
  '/search': '/',
};

// Safe navigation function that uses explicit routes instead of navigate(-1)
export const navigateBack = (navigate: NavigateFunction, currentPath: string) => {
  const backPath = BACK_ROUTE_MAP[currentPath] || '/';
  navigate(backPath);
};

// Context-aware back navigation based on user role and current location
export const navigateBackContextAware = async (
  navigate: NavigateFunction, 
  currentPath: string
): Promise<void> => {
  const { role, loading } = await getUserRoles();
  
  // If still loading, use standard back logic
  if (loading) {
    const backPath = BACK_ROUTE_MAP[currentPath] || '/';
    navigate(backPath);
    return;
  }
  
  // Determine appropriate back path based on current location and role
  const dashboardRoute = getDashboardRoute(role || undefined);
  
  // If on a dashboard sub-page, go back to dashboard
  if (currentPath.includes('/profile') || 
      currentPath.includes('/jobs') || 
      currentPath.includes('/earnings') ||
      currentPath.includes('/chat') ||
      currentPath.includes('/notifications')) {
    navigate(dashboardRoute);
    return;
  }
  
  // If on dashboard itself, go to home
  if (currentPath === dashboardRoute) {
    navigate('/');
    return;
  }
  
  // Use standard back route map or dashboard as fallback
  const backPath = BACK_ROUTE_MAP[currentPath] || dashboardRoute;
  navigate(backPath);
};

// Enhanced navigation helper with location awareness
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

// Get proper dashboard route based on user role
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

// Get proper profile route based on user role
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
