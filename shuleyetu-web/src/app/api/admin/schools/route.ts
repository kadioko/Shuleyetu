import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/adminAuth";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rateLimitError = await withRateLimit(request, rateLimitConfigs.admin);
  if (rateLimitError) return rateLimitError;

  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { data: schools, error } = await supabaseServerClient
      .from("schools")
      .select("id, name, region, district, email, phone, is_active, created_at, school_users(id)")
      .order("created_at", { ascending: false });

    if (error) {
      logError("Error loading admin schools", error, { adminUserId: auth.user.id });
      return jsonError("Failed to load schools", 500);
    }

    return jsonOk({
      schools: (schools ?? []).map((school) => ({
        id: school.id,
        name: school.name,
        region: school.region,
        district: school.district,
        email: school.email,
        phone: school.phone,
        is_active: school.is_active,
        created_at: school.created_at,
        user_count: Array.isArray(school.school_users) ? school.school_users.length : 0,
      })),
    });
  } catch (error) {
    logError("Unexpected error in admin schools", error);
    return jsonError("Internal server error", 500);
  }
}
