import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";
import { requireAdmin } from "@/lib/adminAuth";
import {
  generateClickpesaToken,
  fetchWithRetry,
  mapClickpesaStatus,
} from "@/lib/payments/clickpesa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CLICKPESA_BASE_URL = process.env.CLICKPESA_BASE_URL ?? "https://api.clickpesa.com";
const STUCK_THRESHOLD_MINUTES = 30;

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitResponse) return rateLimitResponse;

    const adminCheck = await requireAdmin(request);
    if (!adminCheck.ok) return adminCheck.response;

    const { data: stuckOrders, error: fetchError } = await supabaseServerClient
      .from("orders")
      .select("id, payment_reference")
      .eq("payment_status", "pending")
      .lte(
        "updated_at",
        new Date(Date.now() - STUCK_THRESHOLD_MINUTES * 60 * 1000).toISOString()
      )
      .limit(50);

    if (fetchError) {
      logError("Failed to fetch stuck orders for reconciliation", fetchError);
      return jsonError("Failed to fetch stuck orders", 500);
    }

    const token = await generateClickpesaToken();

    let reconciled = 0;
    let unchanged = 0;
    let failed = 0;
    const details: { orderId: string; previous: string; current: string }[] = [];

    for (const order of stuckOrders ?? []) {
      const orderReference = order.payment_reference || order.id;
      try {
        const { response, data } = await fetchWithRetry<unknown>(
          `${CLICKPESA_BASE_URL}/third-parties/payments/${encodeURIComponent(orderReference)}`,
          {
            method: "GET",
            headers: { Authorization: token },
          },
          { attempts: 2, backoffMs: 300 }
        );

        if (!response.ok) {
          failed++;
          continue;
        }

        const payments = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
        const latest = payments[0];
        if (!latest) {
          unchanged++;
          continue;
        }

        const clickpesaStatus = String(latest["status"] ?? "");
        const mappedStatus = mapClickpesaStatus(clickpesaStatus);

        const previous = await supabaseServerClient
          .from("orders")
          .select("payment_status")
          .eq("id", order.id)
          .single();

        const { error: updateError } = await supabaseServerClient
          .from("orders")
          .update({
            payment_status: mappedStatus,
            status: mappedStatus === "paid" ? "paid" : "awaiting_payment",
            clickpesa_transaction_id: latest["id"] ?? null,
            clickpesa_raw_payload: data,
            payment_reference: latest["orderReference"] ?? orderReference,
          })
          .eq("id", order.id);

        if (updateError) {
          logError("Failed to update reconciled order", updateError, { orderId: order.id });
          failed++;
          continue;
        }

        await supabaseServerClient.rpc("log_order_audit", {
          p_order_id: order.id,
          p_actor_type: "system",
          p_actor_user_id: null,
          p_action: "payment_reconciled",
          p_payload: {
            provider: "clickpesa",
            order_reference: orderReference,
            previous_status: previous.data?.payment_status ?? "pending",
            current_status: mappedStatus,
            clickpesa_status: clickpesaStatus,
          },
        });

        if (mappedStatus !== "pending") {
          reconciled++;
          details.push({
            orderId: order.id,
            previous: previous.data?.payment_status ?? "pending",
            current: mappedStatus,
          });
        } else {
          unchanged++;
        }
      } catch (error) {
        logError("Error reconciling order", error instanceof Error ? error : new Error(String(error)), {
          orderId: order.id,
        });
        failed++;
      }
    }

    return jsonOk({
      success: true,
      checked: stuckOrders?.length ?? 0,
      reconciled,
      unchanged,
      failed,
      details,
    });
  } catch (error) {
    logError("Unexpected error in reconciliation", error instanceof Error ? error : new Error(String(error)));
    return jsonError("Reconciliation failed", 500);
  }
}
