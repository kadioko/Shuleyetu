import { NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/adminAuth";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";
import { validateRequest, uuidSchema } from "@/lib/validation";

export const runtime = "nodejs";

const revokeAdminBodySchema = z.object({
  userId: uuidSchema,
});

export async function POST(request: NextRequest) {
  const rateLimitError = await withRateLimit(request, rateLimitConfigs.admin);
  if (rateLimitError) return rateLimitError;

  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const validated = await validateRequest(request, { body: revokeAdminBodySchema });
    if (!validated.ok) return validated.response;

    const body = validated.body;
    if (!body) return jsonError("Invalid request body", 400);

    const { userId } = body;

    if (userId === auth.user.id) {
      return jsonError("Cannot revoke yourself", 400);
    }

    const { count, error: countErr } = await supabaseServerClient
      .from("user_roles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "admin");

    if (countErr) {
      logError("Error counting admins", countErr, { adminUserId: auth.user.id });
      return jsonError("Failed to revoke admin", 500);
    }

    if ((count ?? 0) <= 1) {
      return jsonError("Cannot revoke the last admin", 400);
    }

    const { error } = await supabaseServerClient
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "admin");

    if (error) {
      logError("Error revoking admin", error, {
        adminUserId: auth.user.id,
        targetUserId: userId,
      });
      return jsonError("Failed to revoke admin", 500);
    }

    return jsonOk({ success: true });
  } catch (err) {
    logError("Unexpected error in revoke-admin", err);
    return jsonError("Internal server error", 500);
  }
}
