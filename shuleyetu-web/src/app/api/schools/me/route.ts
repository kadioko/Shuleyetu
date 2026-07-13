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

    const { data: school, error: schoolError } = await supabaseServerClient
      .from("schools")
      .select(
        "id, name, region, district, ward, phone, email, address, is_active, created_at, updated_at",
      )
      .eq("id", auth.schoolId)
      .single();

    if (schoolError || !school) {
      logError("Error loading school", schoolError, {
        userId: auth.user.id,
        schoolId: auth.schoolId,
      });
      return jsonError("Failed to load school", 500);
    }

    return jsonOk({
      school,
      role: auth.role,
      user: auth.user,
    });
  } catch (error) {
    logError("Unexpected error in school me", error);
    return jsonError("Internal server error", 500);
  }
}
