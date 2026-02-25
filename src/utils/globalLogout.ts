import { supabase } from '@/lib/supabase';
import { clearPasswordResetFlag, clearRecoveryIntent } from '@/utils/passwordResetGuard';

const log = (msg: string, data?: any) => {
  const ts = new Date().toISOString().split('T')[1];
  console.log(`[${ts}][LOGOUT] ${msg}`, data !== undefined ? data : '');
};

/**
 * Global logout utility that works anywhere in the app
 * Does NOT depend on AuthContext - can be called from public routes
 */
export async function globalLogout(redirectTo: string = '/portal-login') {
  log('=== LOGOUT INITIATED ===');
  log('Current path:', window.location.pathname);
  log('Redirect target:', redirectTo);
  
  try {
    // Step 1: Sign out from Supabase with local scope
    log('Calling supabase.auth.signOut({ scope: "local" })...');
    const signOutStart = Date.now();
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    log(`signOut completed in ${Date.now() - signOutStart}ms`);
    
    if (error) {
      if (error.message?.includes('session missing')) {
        log('Session already cleared (expected)');
      } else {
        log('ERROR: signOut failed:', error.message);
      }
    } else {
      log('signOut successful');
    }
    
    // Step 2: Clear password reset guard flags AND recovery intent
    // PART 3: Clear recovery intent on logout
    log('Clearing password reset flags and recovery intent...');
    clearPasswordResetFlag();
    clearRecoveryIntent();
    
    // Step 3: Clear auth-related storage
    log('Clearing auth storage...');
    
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth') || 
            key.includes('sb-') || key.includes('greenscape-lux-auth') ||
            key.includes('password_reset') || key.includes('recovery_session'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      log('localStorage keys cleared:', keysToRemove);
    } catch (e: any) {
      log('localStorage clear error:', e.message);
    }
    
    try {
      sessionStorage.removeItem('user_role');
      sessionStorage.removeItem('user_role_timestamp');
      sessionStorage.removeItem('recovery_intent'); // PART 3: Also clear from sessionStorage
      log('sessionStorage cleared');
    } catch (e: any) {
      log('sessionStorage clear error:', e.message);
    }
    
    try {
      document.cookie.split(";").forEach(cookie => {
        const name = cookie.split("=")[0].trim();
        if (name.includes('supabase') || name.includes('auth') || name.includes('sb-')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
      log('Cookies cleared');
    } catch (e: any) {
      log('Cookie clear error:', e.message);
    }
    
    // Step 4: Brief wait for cleanup
    log('Waiting 150ms for cleanup...');
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Step 5: Verify session is cleared
    log('Verifying session cleared...');
    const { data: { session } } = await supabase.auth.getSession();
    log('Session after logout:', session ? 'STILL EXISTS!' : 'null (good)');
    
    // Step 6: Redirect
    log('Executing redirect to:', redirectTo);
    window.location.replace(redirectTo);
    
  } catch (error: any) {
    log('EXCEPTION:', error.message);
    window.location.replace(redirectTo);
  }
}

