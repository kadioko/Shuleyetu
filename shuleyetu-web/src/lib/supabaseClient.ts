import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function normalizeSupabaseUrl(url: string | undefined): string {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export const supabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_client) {
      const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const supabaseUrl = normalizeSupabaseUrl(rawUrl);
      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn(
          "Supabase env vars NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY are not set.",
        );
        throw new Error("Supabase env vars are not set.");
      }
      _client = createClient(supabaseUrl, supabaseAnonKey);
    }
    return (_client as unknown as Record<string | symbol, unknown>)[prop];
  },
});
