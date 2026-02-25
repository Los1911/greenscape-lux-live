// Navigation helper utilities for consistent UX
import { NavigateFunction } from 'react-router-dom';
import { getUserRoles } from '@/hooks/useRole';

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

// Route mapping for proper back navigation (for unauthenticated users)
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
  '/get-started': '/', // Role selection goes back to home
  '/forgot-password': '/portal-login', // More intuitive than generic login
  '/reset-password': '/portal-login',
  '/portal-login': '/', // Portal login goes back to home

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

// Auth-aware route mapping (returns dashboard instead of public pages)
const AUTH_BACK_ROUTE_MAP: Record<string, (role: string | null) => string> = {
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
  
  // Dashboard routes - go to dashboard root
  '/client-dashboard': (role) => getDashboardRoute(role),
  '/landscaper-dashboard': (role) => getDashboardRoute(role),
  '/admin-dashboard': (role) => getDashboardRoute(role),
};

/**
 * Check if a route is a public/marketing page
 */
export const isPublicRoute = (path: string): boolean => {
  return PUBLIC_ROUTES.some(route => path === route || path.startsWith(route + '/'));
};

// Safe navigation function that uses explicit routes instead of navigate(-1)
export const navigateBack = (navigate: NavigateFunction, currentPath: string) => {
  const backPath = BACK_ROUTE_MAP[currentPath] || '/';
  navigate(backPath);
};

/**
 * Auth-aware back navigation
 * For authenticated users, never returns a public route
 */
export const navigateBackAuthAware = (
  navigate: NavigateFunction, 
  currentPath: string,
  isAuthenticated: boolean,
  role: string | null
): void => {
  if (isAuthenticated) {
    // Check for auth-aware route mapping first
    const authBackFn = AUTH_BACK_ROUTE_MAP[currentPath];
    if (authBackFn) {
      navigate(authBackFn(role));
      return;
    }
    
    // Check standard back route map, but replace public routes with dashboard
    const standardBack = BACK_ROUTE_MAP[currentPath];
    if (standardBack) {
      if (isPublicRoute(standardBack)) {
        // Don't navigate to public route - go to dashboard instead
        navigate(getDashboardRoute(role));
      } else {
        navigate(standardBack);
      }
      return;
    }
    
    // Default to dashboard for authenticated users
    navigate(getDashboardRoute(role));
  } else {
    // Unauthenticated users use standard back navigation
    const backPath = BACK_ROUTE_MAP[currentPath] || '/';
    navigate(backPath);
  }
};

// Context-aware back navigation based on user role and current location
export const navigateBackContextAware = async (
  navigate: NavigateFunction, 
  currentPath: string
): Promise<void> => {
  const { role, loading } = await getUserRoles();
  const isAuthenticated = !!role && !loading;
  
  // Use auth-aware navigation
  navigateBackAuthAware(navigate, currentPath, isAuthenticated, role);
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
export const getDashboardRoute = (userRole?: string | null): string => {
  switch (userRole) {
    case 'admin':
      return '/admin-dashboard';
    case 'landscaper':
      return '/landscaper-dashboard';
    case 'client':
      return '/client-dashboard';
    default:
      // For authenticated users without a role, default to client dashboard
      // For unauthenticated users, this shouldn't be called
      return '/client-dashboard';
  }
};

// Alias for consistency with the new hook
export const getDefaultDashboardRoute = getDashboardRoute;

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
