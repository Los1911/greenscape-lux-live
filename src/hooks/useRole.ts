import { supabase } from '@/lib/supabase';

// Admin email allowlist - users with these emails get admin access
const ADMIN_EMAILS = [
  'admin.1@greenscapelux.com',
  'bgreen@greenscapelux.com'
];

export interface UserRoles {
  hasClient: boolean;
  hasPro: boolean;
  role: string | null;
  loading: boolean;
}

/**
 * AUTHORITATIVE ROLE RESOLUTION
 * 
 * Priority order:
 * 1. Check landscapers table FIRST (by user_id = auth.uid())
 *    - If landscaper record exists → return "landscaper" immediately
 * 2. Only if NO landscaper record → check profiles table
 *    - If profile.role === 'admin' → return "admin"
 *    - Otherwise → return "client"
 * 
 * This ensures users with valid landscaper records are NEVER misrouted to Client Dashboard.
 */
export async function getUserRoles(): Promise<UserRoles> {

  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { hasClient: false, hasPro: false, role: null, loading: false };
    }

    if (import.meta.env.DEV) {
      console.log('=== USE_ROLE DEBUG (AUTHORITATIVE) ===');
      console.log('📧 Auth User Email:', user.email);
      console.log('🆔 Auth User ID:', user.id);
    }

    // ========================================
    // STEP 1: Check landscapers table FIRST
    // This is the AUTHORITATIVE source for landscaper users
    // ========================================
    const { data: landscaperRecord, error: landscaperError } = await supabase
      .from('landscapers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (import.meta.env.DEV) {
      console.log('🌿 Landscaper Record Check:', { landscaperRecord, landscaperError });
    }

    // If landscaper record exists, IMMEDIATELY return landscaper role
    // Do NOT check profiles.role - landscapers table is authoritative
    if (landscaperRecord && !landscaperError) {
      if (import.meta.env.DEV) {
        console.log('✅ LANDSCAPER RECORD FOUND - Returning landscaper role');
      }
      return { 
        hasClient: false, 
        hasPro: true, 
        role: 'landscaper', 
        loading: false 
      };
    }

    // Log landscaper query error but continue to profile check
    if (landscaperError) {
      console.warn('⚠️ Landscaper query error (continuing to profile check):', landscaperError.message);
    }

    // ========================================
    // STEP 2: No landscaper record - check profiles table
    // ========================================
    if (import.meta.env.DEV) {
      console.log('🔍 No landscaper record found, checking profiles table...');
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (import.meta.env.DEV) {
      console.log('👤 Profile Data:', { profileData, profileError });
    }

    // Handle profile query error
    if (profileError) {
      console.error('❌ Profile query error:', profileError.message);
      // Fallback to client role on error
      return { 
        hasClient: true, 
        hasPro: false, 
        role: 'client', 
        loading: false 
      };
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
      if (import.meta.env.DEV) {
        console.log(`🔐 Admin override for ${user.email}`);
      }
      resolvedRole = 'admin';
    }


    if (import.meta.env.DEV) {
      console.log('🎯 Final Resolved Role:', resolvedRole);
    }

    return { 
      hasClient: resolvedRole === 'client', 
      hasPro: resolvedRole === 'landscaper', 
      role: resolvedRole, 
      loading: false 
    };

  } catch (error) {
    console.error('❌ Exception in getUserRoles:', error);
    // Return client as safe fallback on exception
    return { hasClient: true, hasPro: false, role: 'client', loading: false };
  }
}

/**
 * Navigate to appropriate dashboard after login
 * Uses authoritative role resolution
 */
export async function navigateToRoleDashboard(navigate: (path: string, options?: any) => void) {
  const { role, loading } = await getUserRoles();
  
  if (loading) {
    console.log('⏳ Role still loading - not navigating yet');
    return;
  }
  
  if (role === 'admin') {
    console.log('🚀 Navigating to Admin Dashboard');
    navigate('/admin-dashboard', { replace: true });
  } else if (role === 'landscaper') {
    console.log('🚀 Navigating to Landscaper Dashboard');
    navigate('/landscaper-dashboard', { replace: true });
  } else if (role === 'client') {
    console.log('🚀 Navigating to Client Dashboard');
    navigate('/client-dashboard', { replace: true });
  } else {
    console.error('❌ No valid role found - defaulting to client dashboard');
    navigate('/client-dashboard', { replace: true });
  }
}
