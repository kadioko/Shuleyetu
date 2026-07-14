import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";
import { validateRequest, uuidSchema } from "@/lib/validation";
import {
  generateClickpesaToken,
  fetchWithRetry,
  buildIdempotencyKey,
  mapClickpesaStatus,
} from "@/lib/payments/clickpesa";
import { z } from "zod";

const CLICKPESA_BASE_URL = process.env.CLICKPESA_BASE_URL ?? "https://api.clickpesa.com";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const clickpesaPayBodySchema = z.object({
  orderId: uuidSchema,
  token: z.string().min(1, "token is required"),
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for payment endpoint
    const rateLimitError = await withRateLimit(request, rateLimitConfigs.payment);
    if (rateLimitError) return rateLimitError;

    const validation = await validateRequest(request, { body: clickpesaPayBodySchema });
    if (!validation.ok) return validation.response;

    const { orderId, token: publicToken } = validation.body!;

    const { data: order, error: orderError } = await supabaseServerClient
      .from("orders")
      .select(
        "id, total_amount_tzs, customer_phone, payment_status, payment_reference, clickpesa_transaction_id, public_access_token",
      )
      .eq("id", orderId)
      .eq("public_access_token", publicToken)
      .maybeSingle();

    if (orderError || !order) {
      return jsonError("Order not found", 404);
    }

    if (!order.customer_phone) {
      return jsonError("Order has no customer phone number", 400);
    }

    const orderReference: string =
      order.payment_reference && order.payment_reference.trim().length > 0
        ? order.payment_reference
        : order.id;

    const cleanedPhone = String(order.customer_phone).replace(/\s+/g, "");
    const storedAmount = Number(order.total_amount_tzs);

    if (!Number.isFinite(storedAmount) || storedAmount <= 0) {
      return jsonError("Order amount is invalid", 400);
    }

    // Recalculate total from order items to prevent amount tampering
    const { data: orderItems } = await supabaseServerClient
      .from("order_items")
      .select("quantity, unit_price_tzs")
      .eq("order_id", orderId);

    if (orderItems && orderItems.length > 0) {
      const calculatedTotal = orderItems.reduce(
        (sum, item) => sum + Number(item.unit_price_tzs) * item.quantity,
        0,
      );
      if (Math.abs(calculatedTotal - storedAmount) > 1) {
        logError("Payment amount mismatch", new Error("Amount mismatch"), {
          orderId,
          storedAmount,
          calculatedTotal,
        });
        return jsonError("Order amount mismatch — please contact support", 400);
      }
    }

    const amountNumber = storedAmount;

    const clickpesaToken = await generateClickpesaToken();
    const idempotencyKey = buildIdempotencyKey(orderId, orderReference);

    const payload = {
      amount: amountNumber.toFixed(2),
      currency: "TZS",
      orderReference,
      phoneNumber: cleanedPhone,
    };

    const { response, data } = await fetchWithRetry<Record<string, unknown>>(
      `${CLICKPESA_BASE_URL}/third-parties/payments/initiate-ussd-push-request`,
      {
        method: "POST",
        headers: {
          Authorization: clickpesaToken,
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(payload),
      },
      { attempts: 3, backoffMs: 700 }
    );

    if (!response.ok) {
      const providerMessage =
        (typeof data.message === "string" ? data.message :
         typeof data.error === "string" ? data.error :
         typeof data.detail === "string" ? data.detail : undefined);

      const userMessage =
        providerMessage ||
        "ClickPesa payment initiation failed. Please verify the phone number and try again.";

      // Log failed attempt for admin visibility
      await supabaseServerClient.rpc("log_order_audit", {
        p_order_id: order.id,
        p_actor_type: "system",
        p_actor_user_id: null,
        p_action: "payment_initiate_failed",
        p_payload: {
          provider: "clickpesa",
          status: response.status,
          body: data,
          idempotency_key: idempotencyKey,
        },
      });

      return jsonError(
        userMessage,
        response.status >= 400 && response.status < 500 ? 400 : 502,
        {
          provider: {
            status: response.status,
            body: data,
          },
        },
      );
    }

    const clickpesaStatus = String(data["status"] ?? "");
    const mappedPaymentStatus = mapClickpesaStatus(clickpesaStatus);

    const { error: updateError } = await supabaseServerClient
      .from("orders")
      .update({
        payment_reference: orderReference,
        clickpesa_transaction_id: data["id"] ?? null,
        clickpesa_raw_payload: data,
        payment_status: mappedPaymentStatus,
        status: mappedPaymentStatus === "paid" ? "paid" : "awaiting_payment",
      })
      .eq("id", order.id);

    if (updateError) {
      logError("Failed to update order with ClickPesa info", updateError, { orderId });
    }

    await supabaseServerClient.rpc("log_order_audit", {
      p_order_id: order.id,
      p_actor_type: "system",
      p_actor_user_id: null,
      p_action: mappedPaymentStatus === "paid" ? "payment_completed" : "payment_initiated",
      p_payload: {
        provider: "clickpesa",
        order_reference: orderReference,
        clickpesa_status: clickpesaStatus,
        clickpesa_transaction_id: data["id"] ?? null,
        idempotency_key: idempotencyKey,
      },
    });

    return jsonOk({
      success: true,
      orderId: order.id,
      orderReference,
      clickpesaStatus,
      mappedPaymentStatus,
    });
  } catch (error) {
    logError("Unexpected error in ClickPesa pay API", error);
    const message =
      error instanceof Error ? error.message : "Unexpected error while initiating payment";
    return jsonError(`Unexpected error while initiating ClickPesa payment: ${message}`, 500);
  }
}
