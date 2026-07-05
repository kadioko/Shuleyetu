import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { jsonError, jsonOk, readJsonBody } from "@/lib/apiUtils";
import { log, logError } from "@/lib/logger";

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

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody<{ orderId?: string; token?: string }>(request);

    const orderId = body?.orderId?.trim() ?? "";
    const publicToken = body?.token?.trim() ?? "";

    if (!orderId || !publicToken) return jsonError("orderId and token are required", 400);

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

    const response = await fetch(
      `${CLICKPESA_BASE_URL}/third-parties/payments/${encodeURIComponent(orderReference)}`,
      {
        method: "GET",
        headers: {
          Authorization: clickpesaToken,
        },
      },
    );

    let data: unknown = {};
    try {
      data = await response.json();
    } catch {
      // Body is not JSON — leave data as empty object; the !response.ok branch below surfaces the error
    }

    if (!response.ok) {
      log("error", "ClickPesa status error", {
        orderId,
        orderReference,
        status: response.status,
        body: data,
      });

      const d = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
      const providerMessage =
        (typeof d["message"] === "string" ? d["message"] :
         typeof d["error"] === "string" ? d["error"] :
         typeof d["detail"] === "string" ? d["detail"] : undefined);

      const userMessage =
        providerMessage ||
        "Failed to refresh payment status from ClickPesa. Please try again later.";

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
    const mappedPaymentStatus = mapClickpesaToPaymentStatus(clickpesaStatus);

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
