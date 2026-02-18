import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _serverClient: SupabaseClient | null = null;

export const supabaseServerClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_serverClient) {
      const supabaseUrl =
        process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.warn(
          "Supabase server env vars SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY are not set.",
        );
        throw new Error(
          "Supabase server env vars SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
        );
      }
      _serverClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });
    }
    return (_serverClient as unknown as Record<string | symbol, unknown>)[prop];
  },
});
