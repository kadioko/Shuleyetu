const PRODUCTION_SUPABASE_URL = "https://rqlolaoqstvnffkaqmpt.supabase.co";

function isKeyLikeValue(value: string) {
  return value.startsWith("sb_") || value.startsWith("eyJ");
}

export function normalizeSupabaseUrl(url: string | undefined): string {
  const value = url?.trim();
  if (!value || isKeyLikeValue(value)) return PRODUCTION_SUPABASE_URL;

  const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(normalized);
    if (!parsed.hostname.endsWith(".supabase.co")) return PRODUCTION_SUPABASE_URL;
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return PRODUCTION_SUPABASE_URL;
  }
}

