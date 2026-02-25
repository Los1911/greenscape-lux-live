/**
 * Password Reset Enforcement Guard
 * 
 * Prevents users from accessing protected routes until they have completed
 * a password reset when coming from a Supabase recovery flow.
 * 
 * REFINED LOGIC (Production-Safe):
 * 1. Recovery intent is detected ONLY from URL parameters (code, type=recovery, access_token)
 * 2. Recovery intent is stored in sessionStorage (not localStorage) to prevent persistence issues
 * 3. Guard triggers ONLY when ALL conditions are met:
 *    - Session exists
 *    - session.user.recovery_sent_at is present
 *    - sessionStorage.recovery_intent === "true"
 *    - Password reset has NOT been completed
 * 4. Proactive cleanup prevents stale state from causing false positives
 */

import { Session, User } from '@supabase/supabase-js';

const STORAGE_KEY = 'password_reset_complete';
const RECOVERY_INTENT_KEY = 'recovery_intent';

// ============================================
// PART 1: Recovery Intent Detection
// ============================================

/**
 * Check if the current URL contains recovery flow parameters
 * Recovery intent exists ONLY when URL contains:
 * - Query param `code`
 * - Query param `type=recovery`
 * - Hash containing `access_token`
 */
export function detectRecoveryIntentFromUrl(): boolean {
  try {
    const queryParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    // Check for recovery indicators
    const hasCode = queryParams.has('code');
    const hasRecoveryType = queryParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery';
    const hasAccessToken = hashParams.has('access_token');
    
    const hasRecoveryIntent = hasCode || hasRecoveryType || hasAccessToken;
    
    if (hasRecoveryIntent) {
      console.log('[PasswordResetGuard] Recovery intent detected from URL', {
        hasCode,
        hasRecoveryType,
        hasAccessToken,
        search: window.location.search,
        hash: window.location.hash ? '[present]' : '[empty]'
      });
    }
    
    return hasRecoveryIntent;
  } catch (e) {
    console.error('[PasswordResetGuard] Error detecting recovery intent:', e);
    return false;
  }
}

/**
 * Set recovery intent flag in sessionStorage
 * Called when recovery URL parameters are detected
 */
export function setRecoveryIntent(): void {
  try {
    sessionStorage.setItem(RECOVERY_INTENT_KEY, 'true');
    console.log('[PasswordResetGuard] Recovery intent set in sessionStorage');
  } catch (e) {
    console.error('[PasswordResetGuard] Failed to set recovery intent:', e);
  }
}

/**
 * Check if recovery intent is set
 */
export function hasRecoveryIntent(): boolean {
  try {
    return sessionStorage.getItem(RECOVERY_INTENT_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Clear recovery intent flag from sessionStorage
 * Called on:
 * - Landing page load without recovery params
 * - Login pages load
 * - User logs out
 * - Password reset completes
 */
export function clearRecoveryIntent(): void {
  try {
    sessionStorage.removeItem(RECOVERY_INTENT_KEY);
    console.log('[PasswordResetGuard] Recovery intent cleared from sessionStorage');
  } catch (e) {
    console.error('[PasswordResetGuard] Failed to clear recovery intent:', e);
  }
}

/**
 * Detect and set recovery intent from URL
 * Should be called on initial app load, landing page, and reset password page
 * Returns true if recovery intent was detected and set
 */
export function detectAndSetRecoveryIntent(): boolean {
  const hasIntent = detectRecoveryIntentFromUrl();
  if (hasIntent) {
    setRecoveryIntent();
    return true;
  }
  return false;
}

/**
 * Clear recovery intent if no recovery params are present in URL
 * This prevents stale recovery intent from persisting
 */
export function clearRecoveryIntentIfNoParams(): void {
  const hasIntent = detectRecoveryIntentFromUrl();
  if (!hasIntent) {
    clearRecoveryIntent();
  }
}

// ============================================
// PART 2: Recovery Session Detection
// ============================================

/**
 * Check if the current session is a recovery session
 * Recovery sessions have recovery_sent_at set on the user object
 */
export function isRecoverySession(session: Session | null): boolean {
  if (!session?.user) return false;
  
  const user = session.user as User & { recovery_sent_at?: string };
  
  // Check if recovery_sent_at exists and is recent (within last hour)
  if (user.recovery_sent_at) {
    const recoverySentAt = new Date(user.recovery_sent_at).getTime();
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    // Recovery is considered active if sent within the last hour
    const isRecentRecovery = recoverySentAt > oneHourAgo;
    
    if (isRecentRecovery) {
      console.log('[PasswordResetGuard] Recovery session detected', {
        recovery_sent_at: user.recovery_sent_at,
        isRecent: isRecentRecovery
      });
      return true;
    }
  }
  
  return false;
}

// ============================================
// PART 3: Password Reset Completion Tracking
// ============================================

/**
 * Check if password reset has been completed
 */
export function isPasswordResetComplete(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark password reset as complete
 * Called after successful password update on /reset-password
 */
export function markPasswordResetComplete(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
    // Clear the recovery intent flag
    clearRecoveryIntent();
    console.log('[PasswordResetGuard] Password reset marked as complete');
  } catch (e) {
    console.error('[PasswordResetGuard] Failed to mark reset complete:', e);
  }
}

/**
 * Clear password reset completion flag
 * Called on logout or fresh login
 */
export function clearPasswordResetFlag(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    // Also clear recovery intent
    clearRecoveryIntent();
    console.log('[PasswordResetGuard] Password reset flag cleared');
  } catch (e) {
    console.error('[PasswordResetGuard] Failed to clear reset flag:', e);
  }
}

// ============================================
// LEGACY FUNCTIONS (kept for compatibility)
// ============================================

/**
 * @deprecated Use setRecoveryIntent() instead
 * Mark that a recovery session was detected
 */
export function markRecoverySessionDetected(): void {
  // Now just sets recovery intent
  setRecoveryIntent();
}

/**
 * @deprecated Use hasRecoveryIntent() instead
 * Check if a recovery session was previously detected
 */
export function wasRecoverySessionDetected(): boolean {
  return hasRecoveryIntent();
}

// ============================================
// MAIN GUARD FUNCTION
// ============================================

/**
 * Main guard function - determines if user should be blocked from protected routes
 * 
 * REFINED LOGIC: Returns true ONLY when ALL conditions are met:
 * 1. A Supabase session exists
 * 2. session.user.recovery_sent_at is present (recent recovery)
 * 3. sessionStorage.recovery_intent === "true" (explicit intent from URL)
 * 4. Password reset has NOT been completed
 * 
 * This prevents false positives from persistent state in production.
 */
export function shouldEnforcePasswordReset(session: Session | null): boolean {
  // Condition 1: No session = no enforcement needed
  if (!session?.user) {
    return false;
  }
  
  // Condition 4: If password reset is already complete, allow access
  if (isPasswordResetComplete()) {
    console.log('[PasswordResetGuard] Password reset already complete, allowing access');
    return false;
  }
  
  // Condition 2: Check if this is a recovery session (has recovery_sent_at)
  const isRecovery = isRecoverySession(session);
  
  // Condition 3: Check if recovery intent was explicitly set from URL
  const hasIntent = hasRecoveryIntent();
  
  // CRITICAL: ALL conditions must be true
  if (isRecovery && hasIntent) {
    console.log('[PasswordResetGuard] BLOCKING ACCESS - All conditions met:', {
      hasSession: true,
      isRecoverySession: isRecovery,
      hasRecoveryIntent: hasIntent,
      passwordResetComplete: false
    });
    return true;
  }
  
  // If recovery session exists but NO intent, log but allow access
  // This handles the case where user has old recovery_sent_at but is doing normal login
  if (isRecovery && !hasIntent) {
    console.log('[PasswordResetGuard] Recovery session detected but NO recovery intent - allowing normal access');
  }
  
  return false;
}

/**
 * Get the redirect URL for password reset
 */
export function getPasswordResetRedirectUrl(): string {
  return '/reset-password';
}
