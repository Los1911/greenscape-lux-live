/**
 * Session Recovery Utility
 * Handles session refresh when returning from background/idle
 * Prevents white screens on pull-down refresh, manual refresh, and idle wake
 */
import { supabase } from '@/lib/supabase';

let lastVisibilityChange = Date.now();
let recoveryInProgress = false;
let lastSessionCheck = 0;

// Event to notify components of session recovery
export const SESSION_RECOVERED_EVENT = 'session-recovered';

export function initSessionRecovery() {
  if (typeof document === 'undefined') return;

  console.log('[SessionRecovery] Initializing session recovery handlers');

  // Handle visibility change (background/foreground)
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Handle online/offline transitions
  window.addEventListener('online', handleOnline);

  // Handle page show (back/forward cache)
  window.addEventListener('pageshow', handlePageShow);

  // Handle focus (tab switching)
  window.addEventListener('focus', handleFocus);
}

async function handleVisibilityChange() {
  if (document.visibilityState !== 'visible') {
    lastVisibilityChange = Date.now();
    return;
  }

  const hiddenDuration = Date.now() - lastVisibilityChange;
  
  // Only recover if was hidden for more than 10 seconds (reduced from 30s)
  if (hiddenDuration < 10000) return;

  console.log(`[SessionRecovery] App visible after ${Math.round(hiddenDuration / 1000)}s`);
  await recoverSession('visibility');
}

async function handleOnline() {
  console.log('[SessionRecovery] Network restored');
  await recoverSession('online');
}

async function handlePageShow(event: PageTransitionEvent) {
  // Check if page was restored from back/forward cache
  if (event.persisted) {
    console.log('[SessionRecovery] Page restored from bfcache');
    await recoverSession('bfcache');
  }
}

async function handleFocus() {
  // Debounce focus events - only check every 5 seconds
  const now = Date.now();
  if (now - lastSessionCheck < 5000) return;
  lastSessionCheck = now;

  // Only recover if we haven't checked recently
  const timeSinceLastVisibility = now - lastVisibilityChange;
  if (timeSinceLastVisibility > 30000) {
    await recoverSession('focus');
  }
}

async function recoverSession(trigger: string) {
  if (recoveryInProgress) {
    console.log('[SessionRecovery] Recovery already in progress, skipping');
    return;
  }

  recoveryInProgress = true;

  try {
    console.log(`[SessionRecovery] Starting recovery (trigger: ${trigger})`);

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.warn('[SessionRecovery] Session check failed:', error.message);
      return;
    }

    if (!session) {
      console.log('[SessionRecovery] No session found - user logged out');
      // Clear cached role
      try { sessionStorage.removeItem('user_role'); } catch {}
      return;
    }

    // Check if token is close to expiring (within 5 minutes)
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const expiresIn = expiresAt * 1000 - Date.now();
      
      if (expiresIn < 0) {
        // Token expired - try to refresh
        console.log('[SessionRecovery] Token expired, refreshing...');
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.warn('[SessionRecovery] Refresh failed:', refreshError.message);
          // Clear cached role on refresh failure
          try { sessionStorage.removeItem('user_role'); } catch {}
          return;
        }
        console.log('[SessionRecovery] Token refreshed successfully');
      } else if (expiresIn < 300000) {
        // Token expiring soon (within 5 minutes) - proactively refresh
        console.log('[SessionRecovery] Token expiring soon, refreshing...');
        await supabase.auth.refreshSession();
      }
    }

    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent(SESSION_RECOVERED_EVENT, {
      detail: { trigger, userId: session.user.id }
    }));

    console.log('[SessionRecovery] Session valid');
  } catch (err) {
    console.error('[SessionRecovery] Error:', err);
  } finally {
    recoveryInProgress = false;
  }
}

// Export for manual recovery trigger
export async function forceSessionRecovery() {
  await recoverSession('manual');
}
