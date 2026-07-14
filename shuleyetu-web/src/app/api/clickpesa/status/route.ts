import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";
import { validateRequest, uuidSchema } from "@/lib/validation";
import {
  generateClickpesaToken,
  fetchWithRetry,
  mapClickpesaStatus,
} from "@/lib/payments/clickpesa";
import { z } from "zod";

const CLICKPESA_BASE_URL = process.env.CLICKPESA_BASE_URL ?? "https://api.clickpesa.com";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const clickpesaStatusBodySchema = z.object({
  orderId: uuidSchema,
  token: z.string().min(1, "token is required"),
});

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitResponse) return rateLimitResponse;

    const validation = await validateRequest(request, { body: clickpesaStatusBodySchema });
    if (!validation.ok) return validation.response;

    const body = validation.body;
    if (!body) return jsonError("Invalid request body", 400);

    const { orderId, token: publicToken } = body;

    const { data: order, error: orderError } = await supabaseServerClient
      .from("orders")
      .select("id, payment_reference")
      .eq("id", orderId)
      .eq("public_access_token", publicToken)
      .maybeSingle();

    if (orderError || !order) {
      return jsonError("Order not found", 404);
    }

    const orderReference: string =
      order.payment_reference && order.payment_reference.trim().length > 0
        ? order.payment_reference
        : order.id;

    const clickpesaToken = await generateClickpesaToken();

    const { response, data } = await fetchWithRetry<unknown>(
      `${CLICKPESA_BASE_URL}/third-parties/payments/${encodeURIComponent(orderReference)}`,
      {
        method: "GET",
        headers: {
          Authorization: clickpesaToken,
        },
      },
      { attempts: 3, backoffMs: 500 }
    );

    if (!response.ok) {
      const d = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
      const providerMessage =
        (typeof d["message"] === "string" ? d["message"] :
         typeof d["error"] === "string" ? d["error"] :
         typeof d["detail"] === "string" ? d["detail"] : undefined);

      const userMessage =
        providerMessage ||
        "Failed to refresh payment status from ClickPesa. Please try again later.";

      await supabaseServerClient.rpc("log_order_audit", {
        p_order_id: order.id,
        p_actor_type: "system",
        p_actor_user_id: null,
        p_action: "payment_status_refresh_failed",
        p_payload: {
          provider: "clickpesa",
          order_reference: orderReference,
          status: response.status,
          body: data,
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

    const payments = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
    const latest = payments[0];

    if (!latest) {
      return jsonError("No payment records found for this order in ClickPesa.", 404);
    }

    const clickpesaStatus = String(latest["status"] ?? "");
    const mappedPaymentStatus = mapClickpesaStatus(clickpesaStatus);

    const { error: updateError } = await supabaseServerClient
      .from("orders")
      .update({
        payment_status: mappedPaymentStatus,
        status: mappedPaymentStatus === "paid" ? "paid" : "awaiting_payment",
        payment_reference: latest["orderReference"] ?? orderReference,
        clickpesa_transaction_id: latest["id"] ?? null,
        clickpesa_raw_payload: data,
      })
      .eq("id", order.id);

    if (updateError) {
      logError("Failed to update order with refreshed ClickPesa status", updateError, {
        orderId,
      });
    }

    await supabaseServerClient.rpc("log_order_audit", {
      p_order_id: order.id,
      p_actor_type: "system",
      p_actor_user_id: null,
      p_action: "payment_status_refreshed",
      p_payload: {
        provider: "clickpesa",
        order_reference: latest["orderReference"] ?? orderReference,
        clickpesa_status: clickpesaStatus,
        mapped_status: mappedPaymentStatus,
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
    logError("Unexpected error in ClickPesa status API", error);
    const message =
      error instanceof Error ? error.message : "Unexpected error while refreshing status";
    return jsonError(`Unexpected error while refreshing ClickPesa status: ${message}`, 500);
  }
}
