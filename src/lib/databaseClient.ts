import { createClient } from "@supabase/supabase-js";
import { getRuntimeConfig } from "@/lib/runtimeConfig";

let _client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (_client) return _client;
  const cfg = getRuntimeConfig();
  if (!cfg.url || !cfg.anon) {
    console.error("Supabase config missing, source:", cfg.source);
    return null as any;
  }
  _client = createClient(cfg.url, cfg.anon);
  return _client;
}