import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { requireSchoolUser } from "@/lib/schoolAuth";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const rateLimitError = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitError) return rateLimitError;

    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;

    const { data, error } = await supabaseServerClient
      .from("school_audit_logs")
      .select("id, actor_user_id, action, entity_type, entity_id, metadata, created_at")
      .eq("school_id", auth.schoolId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      logError("Error loading school audit logs", error, { schoolId: auth.schoolId });
      return jsonError("Failed to load audit logs", 500);
    }

    return jsonOk({ logs: data ?? [] });
  } catch (error) {
    logError("Unexpected error in school audit GET", error);
    return jsonError("Internal server error", 500);
  }
}
