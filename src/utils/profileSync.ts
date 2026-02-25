import { supabase } from '@/lib/supabase';

const log = (msg: string, data?: any) => {
  const ts = new Date().toISOString().split('T')[1];
  console.log(`[${ts}][PROFILE_SYNC] ${msg}`, data !== undefined ? data : '');
};

export interface ProfileSyncResult {
  success: boolean;
  role: 'client' | 'landscaper' | 'admin' | null;
  table: string | null;
  profileId: string | null;
  linked: boolean;
  error?: string;
}

/**
 * AUTHORITATIVE PROFILE SYNC
 * 
 * Priority order:
 * 1. Check landscapers table FIRST (by user_id = auth.uid())
 *    - If landscaper record exists → return "landscaper" immediately
 * 2. Only if NO landscaper record → check profiles table for admin
 *    - If profile.role === 'admin' → return "admin"
 *    - Otherwise → return "client"
 * 
 * This ensures users with valid landscaper records are NEVER misrouted.
 */
export async function syncUserProfile(authUserId: string, email: string): Promise<ProfileSyncResult> {
  log('=== AUTHORITATIVE SYNC START ===');
  log('authUserId:', authUserId);
  log('email:', email);
  const startTime = Date.now();

  try {
    // ========================================
    // STEP 1: Check landscapers table FIRST
    // This is the AUTHORITATIVE source for landscaper users
    // ========================================
    log('STEP 1: Checking landscapers table (AUTHORITATIVE)...');
    
    let { data: landscaperProfile, error: landscaperError } = await supabase
      .from('landscapers')
      .select('id, user_id')
      .eq('user_id', authUserId)
      .maybeSingle();

    // If landscaper record exists, IMMEDIATELY return landscaper role
    if (landscaperProfile && !landscaperError) {
      log(`✅ LANDSCAPER RECORD FOUND by user_id in ${Date.now() - startTime}ms`);
      return { 
        success: true, 
        role: 'landscaper', 
        table: 'landscapers', 
        profileId: landscaperProfile.id, 
        linked: true 
      };
    }

    // NOTE: email column does NOT exist in landscapers table
    // Cannot search by email - only user_id works
    // Skip email-based lookup entirely

    // Log landscaper query error but continue
    if (landscaperError) {
      log(`⚠️ Landscaper query error (continuing): ${landscaperError.message}`);
    }



    // Log landscaper query error but continue
    if (landscaperError) {
      log(`⚠️ Landscaper query error (continuing): ${landscaperError.message}`);
    }

    // ========================================
    // STEP 2: No landscaper record - check profiles table
    // ========================================
    log('STEP 2: No landscaper record found, checking profiles table...');

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', authUserId)
      .maybeSingle();

    if (profileData && !profileError) {
      log(`Profile found, role: ${profileData.role}`);

      if (profileData.role === 'admin') {
        log(`✅ ADMIN found in ${Date.now() - startTime}ms`);
        return { 
          success: true, 
          role: 'admin', 
          table: 'profiles', 
          profileId: authUserId, 
          linked: false 
        };
      }

      // Profile says landscaper but no landscaper record exists
      // This is a data inconsistency - default to client
      if (profileData.role === 'landscaper') {
        log(`⚠️ Profile role is landscaper but no landscaper record - defaulting to client`);
      }
    }

    if (profileError) {
      log(`⚠️ Profile query error: ${profileError.message}`);
    }

    // ========================================
    // STEP 3: Check clients table for existing client profile
    // ========================================
    log('STEP 3: Checking clients table...');

    const { data: clientProfile } = await supabase
      .from('clients')
      .select('id, user_id')
      .eq('user_id', authUserId)
      .maybeSingle();

    if (clientProfile) {
      log(`✅ CLIENT found in ${Date.now() - startTime}ms`);
      return { 
        success: true, 
        role: 'client', 
        table: 'clients', 
        profileId: clientProfile.id, 
        linked: true 
      };
    }

    // ========================================
    // STEP 4: Fallback to client
    // ========================================
    log(`✅ FALLBACK to client in ${Date.now() - startTime}ms`);
    return { 
      success: true, 
      role: 'client', 
      table: null, 
      profileId: null, 
      linked: false 
    };

  } catch (error: any) {
    log(`❌ ERROR in ${Date.now() - startTime}ms:`, error.message);
    return { 
      success: false, 
      role: null, 
      table: null, 
      profileId: null, 
      linked: false, 
      error: error.message 
    };
  }
}
