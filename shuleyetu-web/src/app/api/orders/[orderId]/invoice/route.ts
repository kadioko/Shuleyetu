import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { jsonError } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";
import { uuidSchema } from "@/lib/validation";
import { InvoiceDocument, InvoiceData } from "@/lib/invoices/InvoiceDocument";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  orderId: uuidSchema,
});

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const rateLimitResponse = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitResponse) return rateLimitResponse;

    const paramsResult = paramsSchema.safeParse({ orderId: params.orderId });
    if (!paramsResult.success) {
      return jsonError("Invalid order identifier", 400);
    }

    const { orderId } = paramsResult.data;

    const { data: order, error: orderError } = await supabaseServerClient
      .from("orders")
      .select(
        "id, total_amount_tzs, payment_status, customer_name, customer_phone, student_name, school_name, created_at, vendor_id, vendors(name, email, phone_number)"
      )
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      return jsonError("Order not found", 404);
    }

    const { data: items, error: itemsError } = await supabaseServerClient
      .from("order_items")
      .select("quantity, unit_price_tzs, inventory(name)")
      .eq("order_id", orderId);

    if (itemsError) {
      logError("Failed to fetch order items for invoice", itemsError, { orderId });
      return jsonError("Failed to fetch order items", 500);
    }

    const invoiceItems = (items ?? []) as {
      quantity: number;
      unit_price_tzs: number;
      inventory: { name: string } | { name: string }[] | null;
    }[];

    const year = new Date().getFullYear();
    const { data: nextNumber } = await supabaseServerClient.rpc("next_invoice_number", {
      p_vendor_id: order.vendor_id,
      p_year: year,
    });

    const invoiceNumber = `INV-${year}-${String(nextNumber ?? 1).padStart(4, "0")}`;

    const vendor = Array.isArray(order.vendors) ? order.vendors[0] : order.vendors;

    const invoiceData: InvoiceData = {
      invoiceNumber,
      invoiceDate: new Date().toLocaleDateString("en-GB"),
      orderId: order.id,
      orderDate: new Date(order.created_at).toLocaleDateString("en-GB"),
      vendorName: vendor?.name ?? "Shuleyetu Vendor",
      vendorEmail: vendor?.email ?? null,
      vendorPhone: vendor?.phone_number ?? null,
      customerName: order.customer_name ?? "Customer",
      customerPhone: order.customer_phone ?? null,
      studentName: order.student_name ?? null,
      schoolName: order.school_name ?? null,
      paymentStatus: order.payment_status,
      items: invoiceItems.map((item) => ({
        description: Array.isArray(item.inventory)
          ? item.inventory[0]?.name ?? "Item"
          : item.inventory?.name ?? "Item",
        quantity: item.quantity,
        unitPriceTzs: Number(item.unit_price_tzs),
        totalPriceTzs: Number(item.unit_price_tzs) * item.quantity,
      })),
      totalAmountTzs: Number(order.total_amount_tzs),
    };

    const stream = await renderToStream(InvoiceDocument(invoiceData));

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set(
      "Content-Disposition",
      `inline; filename="shuleyetu-invoice-${invoiceNumber}.pdf"`
    );

    // Persist invoice record
    const { error: insertError } = await supabaseServerClient.from("invoices").insert({
      order_id: orderId,
      invoice_number: invoiceNumber,
      amount_tzs: invoiceData.totalAmountTzs,
      status: order.payment_status === "paid" ? "paid" : "issued",
      issued_at: new Date().toISOString(),
      invoice_data: invoiceData as unknown as Record<string, unknown>,
    });

    if (insertError) {
      logError("Failed to persist invoice record", insertError, { orderId, invoiceNumber });
    }

    return new NextResponse(stream as unknown as ReadableStream, { headers });
  } catch (error) {
    logError("Unexpected error generating invoice", error instanceof Error ? error : new Error(String(error)));
    return jsonError("Failed to generate invoice", 500);
  }
}
