import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/adminAuth";
import { jsonError, jsonOk, readJsonBody } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const body = await readJsonBody<{
      vendorId?: string;
      status?: "pending" | "approved" | "rejected";
    }>(request);

    if (!body?.vendorId) return jsonError("Vendor ID is required", 400);
    if (!["pending", "approved", "rejected"].includes(body?.status ?? "")) {
      return jsonError("Valid status is required", 400);
    }

    const { data, error } = await supabaseServerClient
      .from("vendors")
      .update({
        approval_status: body.status,
        is_active: body.status === "approved",
      })
      .eq("id", body.vendorId)
      .select("id, name, approval_status, is_active")
      .single();

    if (error || !data) {
      logError("Error updating vendor approval", error, {
        adminUserId: auth.user.id,
        vendorId: body.vendorId,
      });
      return jsonError("Failed to update vendor approval", 500);
    }

    return jsonOk({ vendor: data });
  } catch (error) {
    logError("Unexpected error in vendor approval", error);
    return jsonError("Internal server error", 500);
  }
}
