import { NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/adminAuth";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";
import { validateRequest, uuidSchema } from "@/lib/validation";

export const runtime = "nodejs";

const unlinkVendorUserBodySchema = z.object({
  userId: uuidSchema,
  vendorId: uuidSchema,
});

export async function POST(request: NextRequest) {
  const rateLimitError = await withRateLimit(request, rateLimitConfigs.admin);
  if (rateLimitError) return rateLimitError;

  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const validated = await validateRequest(request, { body: unlinkVendorUserBodySchema });
    if (!validated.ok) return validated.response;

    const body = validated.body;
    if (!body) return jsonError("Invalid request body", 400);

    const { userId, vendorId } = body;

    const { error } = await supabaseServerClient
      .from("vendor_users")
      .delete()
      .eq("user_id", userId)
      .eq("vendor_id", vendorId);

    if (error) {
      logError("Error unlinking vendor user", error, {
        adminUserId: auth.user.id,
        userId,
        vendorId,
      });
      return jsonError("Failed to unlink", 500);
    }

    return jsonOk({ success: true });
  } catch (err) {
    logError("Unexpected error in unlink-vendor-user", err);
    return jsonError("Internal server error", 500);
  }
}
