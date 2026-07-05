import { NextRequest } from "next/server";
import crypto from "crypto";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { log, logError } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const payload = (() => {
      if (!rawBody) return null;
      try {
        return JSON.parse(rawBody);
      } catch {
        return null;
      }
    })();

    // Verify the webhook signature using HMAC-SHA256 when CLICKPESA_WEBHOOK_SECRET is set.
    // In production the secret is always required; locally it is optional for easier testing.
    const webhookSecret = process.env.CLICKPESA_WEBHOOK_SECRET;
    const signatureHeader = request.headers.get("x-clickpesa-signature");
    const requireSignature = process.env.NODE_ENV === "production" && Boolean(webhookSecret);

    if (requireSignature && !signatureHeader) {
      return jsonError("Missing signature", 401);
    }

    if (webhookSecret && !signatureHeader) {
      log("warn", "ClickPesa webhook signature missing", { hasSecret: true });
    }

    if (webhookSecret && signatureHeader) {
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

    // Update the order
    const { error: updateError } = await supabaseServerClient
      .from("orders")
      .update({
        payment_status: mappedPaymentStatus,
        status: mappedPaymentStatus === "paid" ? "paid" : "awaiting_payment",
        clickpesa_transaction_id: transaction.id,
        clickpesa_raw_payload: payload,
      })
      .eq("payment_reference", orderReference);

    if (updateError) {
      logError("Failed to update order from webhook", updateError, { orderReference });
      return jsonError("Failed to update order", 500);
    }

    return jsonOk({ success: true });
  } catch (error) {
    logError("Unexpected error in ClickPesa webhook", error);
    return jsonError("Internal server error", 500);
  }
}
