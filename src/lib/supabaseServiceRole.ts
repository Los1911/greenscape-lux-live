import { createClient } from '@supabase/supabase-js';
import { secureConfig } from './secureConfig';

// Service role client for server-side operations that bypass RLS
const supabaseUrl = secureConfig.get('VITE_SUPABASE_URL');
const supabaseServiceKey = secureConfig.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Service role configuration missing. Service role operations will be limited.');
}

// Create service role client - bypasses RLS policies
export const supabaseServiceRole = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Helper function to get user role using service role (bypasses RLS)
export async function getUserRoleByEmail(email: string): Promise<string | null> {
  try {
    if (!email) return null;
    
    const { data: user, error } = await supabaseServiceRole
      .from('users')
      .select('role')
      .eq('email', email)
      .single();
    
    if (error) {
      console.error('Service role query error:', error);
      return null;
    }
    
    return user?.role || null;
  } catch (error) {
    console.error('Exception in getUserRoleByEmail:', error);
    return null;
  }
}

// Helper function to ensure user exists in public.users table
export async function ensureUserRecord(authUser: { id: string; email: string; user_metadata?: any }): Promise<boolean> {
  try {
    if (!authUser.id || !authUser.email) return false;
    
    // Check if user exists
    const { data: existingUser } = await supabaseServiceRole
      .from('users')
      .select('id')
      .eq('id', authUser.id)
      .single();
    
    if (existingUser) {
      return true; // User already exists
    }
    
    // Create user record
    const { error } = await supabaseServiceRole
      .from('users')
      .insert({
        id: authUser.id,
        email: authUser.email,
        role: authUser.user_metadata?.role || 'client', // Default to client
        first_name: authUser.user_metadata?.first_name || null,
        last_name: authUser.user_metadata?.last_name || null
      });
    
    if (error) {
      console.error('Error creating user record:', error);
      return false;
    }
    
    console.log('✅ Created user record for:', authUser.email);
    return true;
  } catch (error) {
    console.error('Exception in ensureUserRecord:', error);
    return false;
  }
}

export const serviceConfig = {
  supabaseUrl: supabaseUrl ? 'CONFIGURED' : 'MISSING',
  supabaseServiceKey: supabaseServiceKey ? 'CONFIGURED' : 'MISSING'
};