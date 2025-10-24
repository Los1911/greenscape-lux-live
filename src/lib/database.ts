import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { APP_ENV } from "./config";

let _client: SupabaseClient | null = null;

export function createSupabaseClient(): SupabaseClient {
  if (_client) return _client;
  if (!APP_ENV.SUPABASE_URL || !APP_ENV.SUPABASE_ANON_KEY) {
    throw new Error("Supabase config missing");
  }
  _client = createClient(APP_ENV.SUPABASE_URL, APP_ENV.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return _client;
}

export const supabase = createSupabaseClient();