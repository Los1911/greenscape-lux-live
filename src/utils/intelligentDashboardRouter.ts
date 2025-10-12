import { supabase } from '@/lib/supabase';
import { NavigateFunction } from 'react-router-dom';

export interface UserRoleInfo {
  role: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error?: string;
}

/**
 * Intelligent Dashboard Router
 * Automatically redirects users to their role-specific dashboard based on authentication status and user role
 */
export class IntelligentDashboardRouter {
  private static instance: IntelligentDashboardRouter;
  private roleCache = new Map<string, { role: string; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): IntelligentDashboardRouter {
    if (!IntelligentDashboardRouter.instance) {
      IntelligentDashboardRouter.instance = new IntelligentDashboardRouter();
    }
    return IntelligentDashboardRouter.instance;
  }

  /**
   * Get user role information with caching and fallback handling
   */
  async getUserRoleInfo(): Promise<UserRoleInfo> {
    try {
      // Check authentication status
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ Auth error in getUserRoleInfo:', authError);
        return { role: null, isAuthenticated: false, loading: false, error: authError.message };
      }

      if (!user) {
        return { role: null, isAuthenticated: false, loading: false };
      }

      // Check cache first
      const cached = this.roleCache.get(user.id);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('✅ Using cached role:', cached.role);
        return { role: cached.role, isAuthenticated: true, loading: false };
      }

      // Try user metadata first (fastest)
      const metadataRole = user.user_metadata?.role;
      if (metadataRole && ['client', 'landscaper', 'admin'].includes(metadataRole)) {
        console.log('✅ Got role from metadata:', metadataRole);
        this.cacheRole(user.id, metadataRole);
        return { role: metadataRole, isAuthenticated: true, loading: false };
      }

      // Fallback to database lookup
      console.log('🔍 Querying database for role...');
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (dbError) {
        console.error('❌ Database error fetching role:', dbError);
        // Return client as safe fallback for authenticated users
        const fallbackRole = 'client';
        this.cacheRole(user.id, fallbackRole);
        return { role: fallbackRole, isAuthenticated: true, loading: false, error: dbError.message };
      }

      const role = userData?.role || 'client';
      console.log('✅ Got role from database:', role);
      this.cacheRole(user.id, role);
      
      return { role, isAuthenticated: true, loading: false };
    } catch (error) {
      console.error('❌ Exception in getUserRoleInfo:', error);
      return { role: null, isAuthenticated: false, loading: false, error: String(error) };
    }
  }

  /**
   * Cache user role with timestamp
   */
  private cacheRole(userId: string, role: string): void {
    this.roleCache.set(userId, { role, timestamp: Date.now() });
  }

  /**
   * Clear role cache for a specific user or all users
   */
  clearRoleCache(userId?: string): void {
    if (userId) {
      this.roleCache.delete(userId);
    } else {
      this.roleCache.clear();
    }
  }

  /**
   * Get the appropriate dashboard route for a given role
   */
  getDashboardRoute(role: string): string {
    const routeMap: Record<string, string> = {
      'admin': '/admin-dashboard',
      'landscaper': '/landscaper-dashboard',
      'client': '/client-dashboard'
    };

    return routeMap[role] || '/client-dashboard';
  }

  /**
   * Navigate to role-specific dashboard with loading state handling
   */
  async navigateToRoleDashboard(
    navigate: NavigateFunction, 
    options: { 
      replace?: boolean;
      fallbackRoute?: string;
      onLoading?: () => void;
      onError?: (error: string) => void;
    } = {}
  ): Promise<void> {
    const { replace = true, fallbackRoute = '/login', onLoading, onError } = options;

    try {
      if (onLoading) onLoading();

      const roleInfo = await this.getUserRoleInfo();

      if (roleInfo.loading) {
        console.log('⏳ Role still loading, waiting...');
        return;
      }

      if (!roleInfo.isAuthenticated) {
        console.log('❌ User not authenticated, redirecting to login');
        navigate(fallbackRoute, { replace });
        return;
      }

      if (roleInfo.error && onError) {
        onError(roleInfo.error);
      }

      const dashboardRoute = this.getDashboardRoute(roleInfo.role || 'client');
      console.log('🚀 Navigating to dashboard:', dashboardRoute);
      navigate(dashboardRoute, { replace });

    } catch (error) {
      console.error('❌ Exception in navigateToRoleDashboard:', error);
      if (onError) onError(String(error));
      navigate(fallbackRoute, { replace });
    }
  }

  /**
   * Check if user has access to a specific route based on their role
   */
  async hasRouteAccess(routePath: string): Promise<boolean> {
    const roleInfo = await this.getUserRoleInfo();
    
    if (!roleInfo.isAuthenticated) {
      return false;
    }

    const role = roleInfo.role;
    
    // Define route access rules
    const accessRules: Record<string, string[]> = {
      '/admin-dashboard': ['admin'],
      '/admin': ['admin'],
      '/landscaper-dashboard': ['landscaper'],
      '/pro-dashboard': ['landscaper'],
      '/client-dashboard': ['client'],
      '/dashboard': ['client']
    };

    // Check if route requires specific role
    for (const [route, allowedRoles] of Object.entries(accessRules)) {
      if (routePath.startsWith(route)) {
        return allowedRoles.includes(role || '');
      }
    }

    // Default to allowing access if no specific rules
    return true;
  }

  /**
   * Auto-redirect from generic dashboard routes to role-specific ones
   */
  async handleGenericDashboardRedirect(
    currentPath: string, 
    navigate: NavigateFunction
  ): Promise<void> {
    const genericRoutes = ['/dashboard', '/'];
    
    if (!genericRoutes.some(route => currentPath === route)) {
      return;
    }

    console.log('🔄 Generic dashboard route detected, auto-redirecting...');
    await this.navigateToRoleDashboard(navigate);
  }
}

// Export singleton instance
export const dashboardRouter = IntelligentDashboardRouter.getInstance();

// Convenience hooks and utilities
export const useDashboardRouter = () => {
  return {
    getUserRoleInfo: () => dashboardRouter.getUserRoleInfo(),
    navigateToRoleDashboard: (navigate: NavigateFunction, options?: any) => 
      dashboardRouter.navigateToRoleDashboard(navigate, options),
    hasRouteAccess: (routePath: string) => dashboardRouter.hasRouteAccess(routePath),
    clearCache: (userId?: string) => dashboardRouter.clearRoleCache(userId)
  };
};