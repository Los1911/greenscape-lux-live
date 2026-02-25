import { supabase } from './supabase';

/**
 * Waits for Supabase session to be ready before proceeding
 * Reduced delays to prevent white screen on mobile refresh
 */
export async function waitForSupabaseSession(maxRetries = 2, delayMs = 150): Promise<boolean> {
  // Quick check first - no delay
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (session && !error) {
      return true;
    }
  } catch {
    // Continue to retry logic
  }
  
  // Only retry if first check failed
  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session && !error) {
        return true;
      }
    } catch (err) {
      console.warn(`[Hydration] Session check failed (attempt ${i + 1}/${maxRetries})`);
    }
  }
  
  // Don't block - proceed without session
  return false;
}
