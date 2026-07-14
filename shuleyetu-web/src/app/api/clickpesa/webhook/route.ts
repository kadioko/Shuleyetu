import { NextRequest } from "next/server";
import crypto from "crypto";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { log, logError } from "@/lib/logger";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, rateLimitConfigs.webhook);
    if (rateLimitResponse) return rateLimitResponse;

    const rawBody = await request.text();
    const payload = (() => {
      if (!rawBody) return null;
      try {
        return JSON.parse(rawBody);
      } catch {
        return null;
      }
    })();

    if (typeof payload !== "object" || payload === null) {
      return jsonError("Invalid webhook payload", 400);
    }

    // Verify the webhook signature using HMAC-SHA256.
    // Always required when secret is configured (any environment).
    const webhookSecret = process.env.CLICKPESA_WEBHOOK_SECRET;
    const signatureHeader = request.headers.get("x-clickpesa-signature");

    if (!webhookSecret) {
      logError("CLICKPESA_WEBHOOK_SECRET not configured — rejecting webhook", new Error("Missing CLICKPESA_WEBHOOK_SECRET"));
      return jsonError("Server misconfiguration", 500);
    }

    if (!signatureHeader) {
      return jsonError("Missing signature", 401);
    }

    const presented = signatureHeader.replace(/^sha256=/i, "").trim();
    const computed = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody, "utf8")
      .digest("hex");

    let presentedBuf: Buffer;
    let computedBuf: Buffer;
    try {
      presentedBuf = Buffer.from(presented, "hex");
      computedBuf = Buffer.from(computed, "hex");
    } catch {
      return jsonError("Invalid signature", 401);
    }
    const matches =
      presentedBuf.length === computedBuf.length &&
      crypto.timingSafeEqual(presentedBuf, computedBuf);

    if (!matches) {
      return jsonError("Invalid signature", 401);
    }

    const eventType = payload?.event?.type;
    const transaction = payload?.data?.transaction;

    if (!eventType || !transaction) {
      return jsonError("Invalid webhook payload", 400);
    }

    const orderReference = transaction.orderReference;
    const clickpesaStatus = transaction.status;

    if (!orderReference) {
      return jsonError("Missing orderReference in webhook payload", 400);
    }

    // Map ClickPesa status to our payment status
    const mappedPaymentStatus = (() => {
      const normalized = clickpesaStatus?.toUpperCase();
      if (normalized === "SUCCESS" || normalized === "SETTLED") return "paid";
      if (normalized === "FAILED") return "failed";
      return "pending";
    })();

    // Idempotency: check if this transaction was already processed
    const { data: existingOrder } = await supabaseServerClient
      .from("orders")
      .select("id, clickpesa_transaction_id, payment_status")
      .eq("payment_reference", orderReference)
      .single();

    if (!existingOrder) {
      log("warn", "Webhook received for unknown order reference", { orderReference });
      return jsonError("Order not found", 404);
    }

    if (
      existingOrder.clickpesa_transaction_id === transaction.id &&
      existingOrder.payment_status === mappedPaymentStatus
    ) {
      // Already processed — acknowledge without re-updating
      return jsonOk({ success: true, message: "Already processed" });
    }

    // Update the order
    const { error: updateError } = await supabaseServerClient
      .from("orders")
      .update({
        payment_status: mappedPaymentStatus,
        status: mappedPaymentStatus === "paid" ? "paid" : "awaiting_payment",
        clickpesa_transaction_id: transaction.id,
        clickpesa_raw_payload: payload,
      })
      .eq("id", existingOrder.id);

    if (updateError) {
      logError("Failed to update order from webhook", updateError, { orderReference });
      return jsonError("Failed to update order", 500);
    }

    await supabaseServerClient.rpc("log_order_audit", {
      p_order_id: existingOrder.id,
      p_actor_type: "system",
      p_actor_user_id: null,
      p_action: "payment_webhook_received",
      p_payload: {
        provider: "clickpesa",
        order_reference: orderReference,
        clickpesa_status: clickpesaStatus,
        mapped_status: mappedPaymentStatus,
        clickpesa_transaction_id: transaction.id,
        event_type: eventType,
      },
    });

    return jsonOk({ success: true });
  } catch (error) {
    logError("Unexpected error in ClickPesa webhook", error);
    return jsonError("Internal server error", 500);
  }
}
