import { supabase } from './supabase';

export type ClientProfileInput = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
};

export async function ensureClientProfile(input: ClientProfileInput) {
  // Get the authenticated user
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) throw new Error('Not signed in');

  // Use the ensure_user_and_client RPC function
  const { data, error } = await supabase.rpc('ensure_user_and_client', {
    p_user_id: auth.user.id,
    p_email: input.email,
    p_first_name: input.first_name?.trim() || '',
    p_last_name: input.last_name?.trim() || '',
    p_phone: input.phone || null
  });

  if (error) {
    console.error('RPC error:', error);
    throw error;
  }

  return data;
}