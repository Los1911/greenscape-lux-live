import { supabase } from '@/lib/supabase';

export interface UserRoles {
  hasClient: boolean;
  hasPro: boolean;
  role: string | null;
  loading: boolean;
}

export async function getUserRoles(): Promise<UserRoles> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { hasClient: false, hasPro: false, role: null, loading: false };
    }

    if (import.meta.env.DEV) {
      console.log('=== USE_ROLE DEBUG ===');
      console.log('📧 Auth User Email:', user.email);
      console.log('🆔 Auth User ID:', user.id);
    }

    // Query user role from users table using exact structure
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('id,email,role')
      .eq('email', user.email)
      .single();

    if (import.meta.env.DEV) {
      console.log('👤 DB User Object:', { dbUser, dbError });
      console.log('🎭 DB User Role:', dbUser?.role);
    }

    // If database error, log it and don't return fallback - return loading state
    if (dbError) {
      console.error('❌ Database error fetching role in useRole:', dbError);
      console.error('Error code:', dbError.code);
      console.error('Error message:', dbError.message);
      return { hasClient: false, hasPro: false, role: null, loading: true };
    }

    // If no user found, log it and return loading state
    if (!dbUser) {
      console.warn('⚠️ No user data found in users table for authenticated user');
      return { hasClient: false, hasPro: false, role: null, loading: true };
    }

    // TEMPORARY ADMIN OVERRIDE - Safe unblock for admin.1@greenscapelux.com
    let resolvedRole = dbUser.role;
    if (user.email === 'admin.1@greenscapelux.com') {
      console.log('🔐 USE_ROLE ADMIN OVERRIDE: Forcing admin role for admin.1@greenscapelux.com');
      resolvedRole = 'admin';
    }

    if (import.meta.env.DEV) {
      console.log('🎯 Final Resolved Role:', resolvedRole);
      console.log('=====================');
    }

    const hasClient = resolvedRole === 'client';
    const hasPro = resolvedRole === 'landscaper';

    return { hasClient, hasPro, role: resolvedRole, loading: false };
  } catch (error) {
    console.error('❌ Exception in getUserRoles:', error);
    return { hasClient: false, hasPro: false, role: null, loading: true };
  }
}

// Helper function to navigate to appropriate dashboard after login with loading guard
export async function navigateToRoleDashboard(navigate: (path: string, options?: any) => void) {
  const { role, loading } = await getUserRoles();
  
  // Don't navigate if still loading role
  if (loading) {
    console.log('⏳ Role still loading - not navigating yet');
    return;
  }
  
  if (role === 'admin') {
    navigate('/admin-dashboard', { replace: true });
  } else if (role === 'landscaper') {
    navigate('/landscaper-dashboard', { replace: true });
  } else if (role === 'client') {
    navigate('/client-dashboard', { replace: true });
  } else {
    console.error('❌ No valid role found for user - cannot navigate');
    // Don't navigate if no valid role
  }
}