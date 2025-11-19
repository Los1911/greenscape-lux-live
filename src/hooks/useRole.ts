// src/hooks/useRole.ts
// Synced with AuthContext (final unified version)

import { useAuth } from '@/contexts/AuthContext';

/**
 * useRole()
 * Pulls the authenticated user's role directly from AuthContext.
 * No database lookups. No Supabase role fetching.
 * AuthContext is now the authoritative source of truth.
 */
export function useRole() {
  const { role, loading, user } = useAuth();

  return {
    user,
    role,
    loading,
    hasClient: role === 'client',
    hasPro: role === 'landscaper',
    hasAdmin: role === 'admin'
  };
}

/**
 * Deprecated helper.
 * Left in place so existing imports do not break.
 * All navigation is handled inside AuthContext after login.
 */
export async function navigateToRoleDashboard(
  navigate: (path: string) => void
) {
  console.warn(
    'navigateToRoleDashboard is deprecated. AuthContext now handles all post-login routing.'
  );
}
