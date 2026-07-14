import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";
import { requireAdmin } from "@/lib/adminAuth";
import { validateRequest } from "@/lib/validation";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rejectBodySchema = z.object({
  adminNote: z.string().max(1000).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResponse = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitResponse) return rateLimitResponse;

    const adminCheck = await requireAdmin(request);
    if (!adminCheck.ok) return adminCheck.response;
    const adminId = adminCheck.user.id;

    const validation = await validateRequest(request, { body: rejectBodySchema });
    if (!validation.ok) return validation.response;

    const refundId = params.id;
    const { adminNote } = validation.body ?? {};

    const { data: refund, error: refundError } = await supabaseServerClient
      .from("refund_requests")
      .select("id, order_id, status")
      .eq("id", refundId)
      .single();

    if (refundError || !refund) {
      return jsonError("Refund request not found", 404);
    }

    if (refund.status !== "pending") {
      return jsonError(`Refund request is already ${refund.status}`, 400);
    }

    const { error: updateError } = await supabaseServerClient
      .from("refund_requests")
      .update({
        status: "rejected",
        admin_note: adminNote ?? null,
        processed_by: adminId,
        processed_at: new Date().toISOString(),
      })
      .eq("id", refundId);

    if (updateError) {
      logError("Failed to reject refund request", updateError, { refundId });
      return jsonError("Failed to reject refund", 500);
    }

    await supabaseServerClient.rpc("log_order_audit", {
      p_order_id: refund.order_id,
      p_actor_type: "admin",
      p_actor_user_id: adminId,
      p_action: "refund_rejected",
      p_payload: {
        refund_request_id: refundId,
        admin_note: adminNote ?? null,
      },
    });

    return jsonOk({ success: true, refundRequestId: refundId, status: "rejected" });
  } catch (error) {
    logError("Unexpected error rejecting refund", error instanceof Error ? error : new Error(String(error)));
    return jsonError("Failed to reject refund", 500);
  }
}
