import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const refundId = params.id;

    const { data: refund, error: refundError } = await supabaseServerClient
      .from("refund_requests")
      .select("id, order_id, amount_tzs, status")
      .eq("id", refundId)
      .single();

    if (refundError || !refund) {
      return jsonError("Refund request not found", 404);
    }

    if (refund.status !== "pending") {
      return jsonError(`Refund request is already ${refund.status}`, 400);
    }

    const { data: order, error: orderError } = await supabaseServerClient
      .from("orders")
      .select("id, total_amount_tzs, payment_status")
      .eq("id", refund.order_id)
      .single();

    if (orderError || !order) {
      return jsonError("Order not found", 404);
    }

    if (order.payment_status !== "paid" && order.payment_status !== "refunded") {
      return jsonError("Cannot approve refund for an order that is not paid", 400);
    }

    const { data: ledgerSum, error: ledgerError } = await supabaseServerClient
      .from("refund_ledger")
      .select("amount_tzs")
      .eq("order_id", order.id)
      .eq("entry_type", "refund");

    const refundedSoFar = (ledgerSum ?? []).reduce(
      (sum, row) => sum + Number(row.amount_tzs),
      0
    );

    const maxRefundable = Number(order.total_amount_tzs) - refundedSoFar;
    if (Number(refund.amount_tzs) > maxRefundable) {
      return jsonError(
        `Refund amount exceeds remaining refundable balance (${maxRefundable.toFixed(2)} TZS)`,
        400
      );
    }

    const { error: updateError } = await supabaseServerClient
      .from("refund_requests")
      .update({
        status: "approved",
        processed_by: adminId,
        processed_at: new Date().toISOString(),
      })
      .eq("id", refundId);

    if (updateError) {
      logError("Failed to approve refund request", updateError, { refundId });
      return jsonError("Failed to approve refund", 500);
    }

    const { error: ledgerInsertError } = await supabaseServerClient
      .from("refund_ledger")
      .insert({
        refund_request_id: refundId,
        order_id: order.id,
        amount_tzs: refund.amount_tzs,
        entry_type: "refund",
        reference: `REF-${refundId.slice(0, 8).toUpperCase()}`,
        note: "Admin approved refund",
        created_by: adminId,
      });

    if (ledgerInsertError) {
      logError("Failed to insert refund ledger entry", ledgerInsertError, { refundId });
      return jsonError("Failed to record refund ledger", 500);
    }

    const newRefundedTotal = refundedSoFar + Number(refund.amount_tzs);
    const newPaymentStatus =
      newRefundedTotal >= Number(order.total_amount_tzs) ? "refunded" : "paid";

    const { error: orderUpdateError } = await supabaseServerClient
      .from("orders")
      .update({
        payment_status: newPaymentStatus,
        status: newPaymentStatus === "refunded" ? "cancelled" : "paid",
      })
      .eq("id", order.id);

    if (orderUpdateError) {
      logError("Failed to update order payment status after refund", orderUpdateError, {
        orderId: order.id,
      });
      return jsonError("Failed to update order status", 500);
    }

    await supabaseServerClient.rpc("log_order_audit", {
      p_order_id: order.id,
      p_actor_type: "admin",
      p_actor_user_id: adminId,
      p_action: "refund_approved",
      p_payload: {
        refund_request_id: refundId,
        amount_tzs: refund.amount_tzs,
        new_payment_status: newPaymentStatus,
      },
    });

    return jsonOk({
      success: true,
      refundRequestId: refundId,
      orderId: order.id,
      newPaymentStatus,
    });
  } catch (error) {
    logError("Unexpected error approving refund", error instanceof Error ? error : new Error(String(error)));
    return jsonError("Failed to approve refund", 500);
  }
}
