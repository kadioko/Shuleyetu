import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/adminAuth";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { data, error } = await supabaseServerClient
      .from("vendors")
      .select("id, name")
      .order("created_at", { ascending: false });

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
