import { supabase } from '@/lib/supabase';
import { NavigateFunction } from 'react-router-dom';

// Admin email allowlist - users with these emails get admin access
const ADMIN_EMAILS = [
  'admin.1@greenscapelux.com',
  'bgreen@greenscapelux.com'
];

export interface UserRoleInfo {
  role: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error?: string;
}

/**
 * Intelligent Dashboard Router
 * 
 * AUTHORITATIVE ROLE RESOLUTION:
 * 1. Check landscapers table FIRST (by user_id = auth.uid())
 *    - If landscaper record exists → return "landscaper" immediately
 * 2. Only if NO landscaper record → check profiles table
 *    - If profile.role === 'admin' → return "admin"
 *    - Otherwise → return "client"
 * 
 * This ensures users with valid landscaper records are NEVER misrouted to Client Dashboard.
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
   * Get user role information with AUTHORITATIVE landscaper-first resolution
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

      console.log('=== INTELLIGENT DASHBOARD ROUTER (AUTHORITATIVE) ===');
      console.log('📧 Auth User Email:', user.email);
      console.log('🆔 Auth User ID:', user.id);

      // ========================================
      // STEP 1: Check landscapers table FIRST
      // This is the AUTHORITATIVE source for landscaper users
      // ========================================
      const { data: landscaperRecord, error: landscaperError } = await supabase
        .from('landscapers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('🌿 Landscaper Record Check:', { 
        found: !!landscaperRecord, 
        error: landscaperError?.message 
      });

      // If landscaper record exists, IMMEDIATELY return landscaper role
      // Do NOT check profiles.role or user_metadata - landscapers table is authoritative
      if (landscaperRecord && !landscaperError) {
        console.log('✅ LANDSCAPER RECORD FOUND - Returning landscaper role');
        this.cacheRole(user.id, 'landscaper');
        return { role: 'landscaper', isAuthenticated: true, loading: false };
      }

      // Log landscaper query error but continue to profile check
      if (landscaperError) {
        console.warn('⚠️ Landscaper query error (continuing to profile check):', landscaperError.message);
      }

      // ========================================
      // STEP 2: No landscaper record - check profiles table
      // ========================================
      console.log('🔍 No landscaper record found, checking profiles table...');

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('👤 Profile Data:', { 
        role: profileData?.role, 
        error: profileError?.message 
      });

      // Handle profile query error
      if (profileError) {
        console.error('❌ Profile query error:', profileError.message);
        // Return client as safe default on error
        this.cacheRole(user.id, 'client');
        return { role: 'client', isAuthenticated: true, loading: false, error: profileError.message };
      }

      // Determine role from profile
      let resolvedRole = 'client'; // Default to client

      if (profileData?.role === 'admin') {
        resolvedRole = 'admin';
      } else if (profileData?.role === 'landscaper') {
        // Profile says landscaper but no landscaper record exists
        // This is a data inconsistency - default to client for safety
        console.warn('⚠️ Profile role is landscaper but no landscaper record exists - defaulting to client');
        resolvedRole = 'client';
      } else {
        resolvedRole = 'client';
      }

      // Admin override for allowlisted emails
      if (user.email && ADMIN_EMAILS.includes(user.email)) {
        console.log(`🔐 Admin override for ${user.email}`);
        resolvedRole = 'admin';
      }


      console.log('🎯 Final Resolved Role:', resolvedRole);
      this.cacheRole(user.id, resolvedRole);
      
      return { role: resolvedRole, isAuthenticated: true, loading: false };

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
    console.log('🗑️ Role cache cleared', userId ? `for user ${userId}` : 'for all users');
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

      // Only navigate if we have a valid role - don't default to client
      if (!roleInfo.role) {
        console.error('❌ No valid role found, cannot navigate to dashboard');
        if (onError) onError('No valid role found');
        navigate(fallbackRoute, { replace });
        return;
      }

      const dashboardRoute = this.getDashboardRoute(roleInfo.role);
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
      '/landscaper-profile': ['landscaper'],
      '/landscaper-jobs': ['landscaper'],
      '/landscaper-earnings': ['landscaper'],
      '/landscaper-payouts': ['landscaper'],
      '/client-dashboard': ['client'],
      '/client-profile': ['client'],
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
