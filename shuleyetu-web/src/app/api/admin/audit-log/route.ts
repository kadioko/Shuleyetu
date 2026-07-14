import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";
import { requireAdmin } from "@/lib/adminAuth";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  orderId: z.string().uuid().optional(),
  action: z.string().optional(),
  limit: z.coerce.number().min(1).max(500).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitResponse) return rateLimitResponse;

    const adminCheck = await requireAdmin(request);
    if (!adminCheck.ok) return adminCheck.response;

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      orderId: searchParams.get("orderId") ?? undefined,
      action: searchParams.get("action") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });

    if (!parsed.success) {
      return jsonError("Invalid query parameters", 400);
    }

    const { orderId, action, limit, offset } = parsed.data;

    let query = supabaseServerClient
      .from("order_audit_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (orderId) {
      query = query.eq("order_id", orderId);
    }
    if (action) {
      query = query.eq("action", action);
    }

    const { data, error, count } = await query;

    if (error) {
      logError("Failed to fetch audit log", error);
      return jsonError("Failed to fetch audit log", 500);
    }

    return jsonOk({
      success: true,
      logs: data ?? [],
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (error) {
    logError("Unexpected error fetching audit log", error instanceof Error ? error : new Error(String(error)));
    return jsonError("Failed to fetch audit log", 500);
  }
}
