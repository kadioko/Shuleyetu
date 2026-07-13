import { NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/adminAuth";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";
import { validateRequest, uuidSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const vendorApprovalBodySchema = z.object({
  vendorId: uuidSchema,
  status: z.enum(["approved", "rejected", "pending"]),
});

export async function POST(request: NextRequest) {
  const rateLimitError = await withRateLimit(request, rateLimitConfigs.admin);
  if (rateLimitError) return rateLimitError;

  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const validated = await validateRequest(request, { body: vendorApprovalBodySchema });
    if (!validated.ok) return validated.response;

    const body = validated.body;
    if (!body) return jsonError("Invalid request body", 400);

    const { vendorId, status } = body;

    const { data, error } = await supabaseServerClient
      .from("vendors")
      .update({
        approval_status: status,
        is_active: status === "approved",
      })
      .eq("id", vendorId)
      .select("id, name, approval_status, is_active")
      .single();

    if (error || !data) {
      logError("Error updating vendor approval", error, {
        adminUserId: auth.user.id,
        vendorId,
      });
      return jsonError("Failed to update vendor approval", 500);
    }

    return jsonOk({ vendor: data });
  } catch (error) {
    logError("Unexpected error in vendor approval", error);
    return jsonError("Internal server error", 500);
  }
}
