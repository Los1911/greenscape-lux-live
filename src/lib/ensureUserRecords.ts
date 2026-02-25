/**
 * GREENSCAPE LUX SYSTEM STABILIZATION
 * 
 * ensureUserRecords - Client-side utility to guarantee user records exist
 * 
 * CANONICAL IDENTITY RULES:
 * - auth.users.id is the SINGLE owner key
 * - profiles.id = auth.users.id
 * - clients.user_id = auth.users.id
 * - landscapers.user_id = auth.users.id
 * - jobs.client_user_id = auth.users.id
 * 
 * This function MUST be called:
 * 1. After any login (email/password or OAuth)
 * 2. After any signup
 * 3. Before any client write operation (as a guard)
 */

import { supabase } from './supabase';

export interface EnsureUserRecordsInput {
  role?: 'client' | 'landscaper' | 'admin';
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface EnsureUserRecordsResult {
  success: boolean;
  userId: string | null;
  role: string | null;
  usersCreated: boolean;
  clientsCreated: boolean;
  landscapersCreated: boolean;
  error?: string;
}

/**
 * Ensures all required user records exist in the database.
 * This is the STABILITY GUARANTEE for the identity system.
 * 
 * Call this after ANY login/signup to guarantee:
 * - users table record exists
 * - clients table record exists (if role = 'client')
 * - landscapers table record exists (if role = 'landscaper')
 */
export async function ensureUserRecords(
  input: EnsureUserRecordsInput = {}
): Promise<EnsureUserRecordsResult> {
  try {
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[ensureUserRecords] Not authenticated:', authError);
      return {
        success: false,
        userId: null,
        role: null,
        usersCreated: false,
        clientsCreated: false,
        landscapersCreated: false,
        error: 'Not authenticated'
      };
    }

    // Determine role from input or user metadata
    const role = input.role || 
                 (user.user_metadata?.role as string) || 
                 'client';

    console.log('[ensureUserRecords] Ensuring records for:', {
      userId: user.id,
      email: user.email,
      role,
      firstName: input.firstName,
      lastName: input.lastName
    });

    // Call the server-side RPC function
    const { data, error: rpcError } = await supabase.rpc('ensure_user_records', {
      p_user_id: user.id,
      p_email: user.email || '',
      p_role: role,
      p_first_name: input.firstName || user.user_metadata?.first_name || '',
      p_last_name: input.lastName || user.user_metadata?.last_name || '',
      p_phone: input.phone || user.user_metadata?.phone || null
    });

    if (rpcError) {
      console.error('[ensureUserRecords] RPC error:', rpcError);
      return {
        success: false,
        userId: user.id,
        role,
        usersCreated: false,
        clientsCreated: false,
        landscapersCreated: false,
        error: rpcError.message
      };
    }

    console.log('[ensureUserRecords] Success:', data);

    return {
      success: true,
      userId: user.id,
      role,
      usersCreated: data?.users_created || false,
      clientsCreated: data?.clients_created || false,
      landscapersCreated: data?.landscapers_created || false
    };

  } catch (err: any) {
    console.error('[ensureUserRecords] Exception:', err);
    return {
      success: false,
      userId: null,
      role: null,
      usersCreated: false,
      clientsCreated: false,
      landscapersCreated: false,
      error: err.message || 'Unknown error'
    };
  }
}

/**
 * UI Guard: Validates session and required records before any client write.
 * Auto-repairs by calling ensureUserRecords if records are missing.
 * 
 * Use this before:
 * - Quote submissions
 * - Job creation
 * - Any client write operation
 */
export async function validateAndRepairUserRecords(): Promise<{
  valid: boolean;
  userId: string | null;
  error?: string;
}> {
  try {
    // Step 1: Check session exists
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return {
        valid: false,
        userId: null,
        error: 'No active session'
      };
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    // Step 2: Check if users table record exists
    const { data: usersRecord, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (usersError) {
      console.warn('[validateAndRepairUserRecords] Users check error:', usersError);
    }

    // Step 3: Check if clients table record exists (for client role)
    const { data: clientsRecord, error: clientsError } = await supabase
      .from('clients')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (clientsError) {
      console.warn('[validateAndRepairUserRecords] Clients check error:', clientsError);
    }

    // Step 4: If any record is missing, auto-repair
    if (!usersRecord || !clientsRecord) {
      console.log('[validateAndRepairUserRecords] Missing records detected, auto-repairing...');
      
      const repairResult = await ensureUserRecords({
        role: 'client',
        firstName: session.user.user_metadata?.first_name,
        lastName: session.user.user_metadata?.last_name,
        phone: session.user.user_metadata?.phone
      });

      if (!repairResult.success) {
        return {
          valid: false,
          userId,
          error: `Auto-repair failed: ${repairResult.error}`
        };
      }

      console.log('[validateAndRepairUserRecords] Auto-repair successful');
    }

    return {
      valid: true,
      userId
    };

  } catch (err: any) {
    console.error('[validateAndRepairUserRecords] Exception:', err);
    return {
      valid: false,
      userId: null,
      error: err.message || 'Validation failed'
    };
  }
}

/**
 * Get the canonical user ID for the current session.
 * This is the single source of truth for identity.
 */
export async function getCanonicalUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}
