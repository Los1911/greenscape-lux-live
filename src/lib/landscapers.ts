import { supabase } from "./supabase";
import { isUUID } from "./isUUID";

// READ-ONLY helpers only - no profile creation
// Profile creation handled by RPC ensure_user_and_landscaper

export async function getMyLandscaper() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('Not authenticated') };

  const { data, error } = await supabase
    .from('landscapers')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle(); // Use maybeSingle() to avoid PGRST116 error

  return { data, error };
}

export async function getLandscaperById(id: string) {
  if (!isUUID(id)) {
    return { data: null, error: new Error('Invalid landscaper id') };
  }
  
  const { data, error } = await supabase
    .from('landscapers')
    .select('*')
    .eq('id', id)
    .maybeSingle(); // Use maybeSingle() to avoid PGRST116 error

  return { data, error };
}

// removed legacy RPC call — handled by trigger in DB