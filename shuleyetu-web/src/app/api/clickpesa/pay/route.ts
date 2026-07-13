import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { log, logError } from "@/lib/logger";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";
import { validateRequest, uuidSchema } from "@/lib/validation";
import { z } from "zod";

const CLICKPESA_BASE_URL = process.env.CLICKPESA_BASE_URL ?? "https://api.clickpesa.com";
const CLICKPESA_CLIENT_ID = process.env.CLICKPESA_CLIENT_ID;
const CLICKPESA_API_KEY = process.env.CLICKPESA_API_KEY;

export const runtime = "nodejs";

function mapClickpesaToPaymentStatus(status: string): "pending" | "paid" | "failed" {
  const normalized = status.toUpperCase();
  if (normalized === "SUCCESS" || normalized === "SETTLED") return "paid";
  if (normalized === "FAILED") return "failed";
  return "pending";
}

async function generateClickpesaToken(): Promise<string> {
  if (!CLICKPESA_CLIENT_ID || !CLICKPESA_API_KEY) {
    throw new Error("ClickPesa credentials are not configured");
  }

  const response = await fetch(
    `${CLICKPESA_BASE_URL}/third-parties/generate-token`,
    {
      method: "POST",
      headers: {
        "client-id": CLICKPESA_CLIENT_ID,
        "api-key": CLICKPESA_API_KEY,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to generate ClickPesa token (${response.status})`);
  }

  const data = (await response.json()) as { success?: boolean; token?: string };

  if (!data.token) {
    throw new Error("No token returned by ClickPesa");
  }

  return data.token;
}

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

    const payload = {
      amount: amountNumber.toFixed(2),
      currency: "TZS",
      orderReference,
      phoneNumber: cleanedPhone,
    };

    const response = await fetch(
      `${CLICKPESA_BASE_URL}/third-parties/payments/initiate-ussd-push-request`,
      {
        method: "POST",
        headers: {
          Authorization: clickpesaToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    let data: Record<string, unknown> = {};
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      // Body is not JSON — leave data as empty object; the !response.ok branch below surfaces the error
    }

    if (!response.ok) {
      log("error", "ClickPesa initiate error", {
        orderId,
        orderReference,
        status: response.status,
        body: data,
      });

      const providerMessage =
        (typeof data.message === "string" ? data.message :
         typeof data.error === "string" ? data.error :
         typeof data.detail === "string" ? data.detail : undefined);

      const userMessage =
        providerMessage ||
        "ClickPesa payment initiation failed. Please verify the phone number and try again.";

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
    const mappedPaymentStatus = mapClickpesaToPaymentStatus(clickpesaStatus);

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
