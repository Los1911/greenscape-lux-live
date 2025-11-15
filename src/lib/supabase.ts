// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Modern Supabase client uses PUBLISHABLE KEY, not anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Hard fail if missing (safe)
if (!supabaseUrl) throw new Error("Missing env: VITE_SUPABASE_URL");
if (!supabaseKey) throw new Error("Missing env: VITE_SUPABASE_PUBLISHABLE_KEY");

// Create client using the new public key format
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  }
});

export default supabase;