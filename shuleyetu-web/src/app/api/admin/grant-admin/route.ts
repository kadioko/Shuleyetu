import { NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/adminAuth";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";
import { validateRequest, emailSchema } from "@/lib/validation";

export const runtime = "nodejs";

const grantAdminBodySchema = z.object({
  email: emailSchema,
});

export async function POST(request: NextRequest) {
  const rateLimitError = await withRateLimit(request, rateLimitConfigs.admin);
  if (rateLimitError) return rateLimitError;

  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const validated = await validateRequest(request, { body: grantAdminBodySchema });
    if (!validated.ok) return validated.response;

    const body = validated.body;
    if (!body) return jsonError("Invalid request body", 400);

    const email = body.email.trim().toLowerCase();

    const { data: targetUserId, error: userIdErr } = await supabaseServerClient.rpc(
      "get_user_id_by_email",
      { p_email: email },
    );

    if (userIdErr || !targetUserId) {
      if (userIdErr) {
        logError("Error resolving user id for grant-admin", userIdErr, {
          adminUserId: auth.user.id,
          targetEmail: email,
        });
      }
      return jsonError("User not found", 404);
    }

    const { error: insertErr } = await supabaseServerClient
      .from("user_roles")
      .insert({ user_id: targetUserId, role: "admin" });

    if (insertErr) {
      const code = (insertErr as any)?.code;
      if (code === "23505") {
        return jsonOk({ success: true, alreadyAdmin: true });
      }
      logError("Failed to grant admin role", insertErr, {
        adminUserId: auth.user.id,
        targetEmail: email,
        targetUserId,
      });
      return jsonError("Failed to grant admin", 500);
    }

    return jsonOk({ success: true, alreadyAdmin: false });
  } catch (err) {
    logError("Unexpected error in grant-admin", err);
    return jsonError("Internal server error", 500);
  }
}
