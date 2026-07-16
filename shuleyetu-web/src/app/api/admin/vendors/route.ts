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

    const primary = await supabaseServerClient
      .from("vendors")
      .select("id, name, email, phone_number, region, district, ward, approval_status, is_active, created_at")
      .order("created_at", { ascending: false });
    let data: Record<string, unknown>[] | null = primary.data;
    let error = primary.error;

    if (
      error &&
      (error.message?.toLowerCase().includes("approval_status") ||
        error.code === "42703")
    ) {
      const fallback = await supabaseServerClient
        .from("vendors")
        .select("id, name, email, phone_number, region, district, ward, is_active, created_at")
        .order("created_at", { ascending: false });
      data = fallback.data
        ? fallback.data.map((vendor) => ({ ...vendor, approval_status: null }))
        : fallback.data;
      error = fallback.error;
    }

    if (error) {
      logError("Error loading vendors", error, { adminUserId: auth.user.id });
      return jsonError("Failed to load vendors", 500);
    }

    return jsonOk({ vendors: data ?? [] });
  } catch (err) {
    logError("Unexpected error in admin vendors", err);
    return jsonError("Internal server error", 500);
  }
}
