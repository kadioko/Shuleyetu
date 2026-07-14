import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";
import { validateRequest, uuidSchema } from "@/lib/validation";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const refundBodySchema = z.object({
  orderId: uuidSchema,
  amountTzs: z.number().positive("Refund amount must be positive"),
  reason: z.string().min(3, "Reason is required").max(1000),
});

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitResponse) return rateLimitResponse;

    const auth = request.headers.get("authorization");
    if (!auth) {
      return jsonError("Unauthorized", 401);
    }

    const { data: userData, error: userError } = await supabaseServerClient.auth.getUser(
      auth.replace("Bearer ", "")
    );
    if (userError || !userData.user) {
      return jsonError("Unauthorized", 401);
    }
    const userId = userData.user.id;

    const validation = await validateRequest(request, { body: refundBodySchema });
    if (!validation.ok) return validation.response;

    const { orderId, amountTzs, reason } = validation.body!;

    const { data: order, error: orderError } = await supabaseServerClient
      .from("orders")
      .select("id, vendor_id, total_amount_tzs, payment_status, customer_phone, customer_name")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      return jsonError("Order not found", 404);
    }

    const isOwner = order.customer_phone === userData.user.email || order.customer_name === userId;
    const isAdmin = await checkAdmin(userId);

    if (!isOwner && !isAdmin) {
      return jsonError("Forbidden", 403);
    }

    if (order.payment_status !== "paid") {
      return jsonError("Refunds can only be requested for paid orders", 400);
    }

    const { data: existing, error: existingError } = await supabaseServerClient
      .from("refund_requests")
      .select("id, status, amount_tzs")
      .eq("order_id", orderId)
      .in("status", ["pending", "approved", "completed"])
      .maybeSingle();

    if (existingError) {
      logError("Failed to check existing refund requests", existingError, { orderId });
      return jsonError("Failed to check refund status", 500);
    }

    if (existing) {
      return jsonError(
        `A refund request already exists for this order (${existing.status})`,
        409
      );
    }

    const { data: refund, error: insertError } = await supabaseServerClient
      .from("refund_requests")
      .insert({
        order_id: orderId,
        requester_user_id: userId,
        amount_tzs: amountTzs,
        reason,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !refund) {
      logError("Failed to create refund request", insertError ?? new Error("No data"), { orderId });
      return jsonError("Failed to create refund request", 500);
    }

    await supabaseServerClient.rpc("log_order_audit", {
      p_order_id: orderId,
      p_actor_type: isAdmin ? "admin" : "customer",
      p_actor_user_id: userId,
      p_action: "refund_requested",
      p_payload: {
        refund_request_id: refund.id,
        amount_tzs: amountTzs,
        reason,
      },
    });

    return jsonOk({
      success: true,
      refundRequestId: refund.id,
      message: "Refund request submitted and is pending review",
    });
  } catch (error) {
    logError("Unexpected error creating refund request", error instanceof Error ? error : new Error(String(error)));
    return jsonError("Failed to create refund request", 500);
  }
}

async function checkAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabaseServerClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !error && !!data;
}
