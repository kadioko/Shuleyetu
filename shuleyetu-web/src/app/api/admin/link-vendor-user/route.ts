import { NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/adminAuth";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";
import { validateRequest, emailSchema, uuidSchema } from "@/lib/validation";

export const runtime = "nodejs";

const linkVendorUserBodySchema = z.object({
  email: emailSchema,
  vendorId: uuidSchema,
});

export async function POST(request: NextRequest) {
  const rateLimitError = await withRateLimit(request, rateLimitConfigs.admin);
  if (rateLimitError) return rateLimitError;

  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const validated = await validateRequest(request, { body: linkVendorUserBodySchema });
    if (!validated.ok) return validated.response;

    const body = validated.body;
    if (!body) return jsonError("Invalid request body", 400);

    const email = body.email.trim().toLowerCase();
    const vendorId = body.vendorId;

    const { data: userId, error: userErr } = await supabaseServerClient.rpc(
      "get_user_id_by_email",
      { p_email: email },
    );

    if (userErr || !userId) {
      return jsonError("User not found", 404);
    }

    const { data: vendorRow, error: vendorErr } = await supabaseServerClient
      .from("vendors")
      .select("id")
      .eq("id", vendorId)
      .maybeSingle();

    if (vendorErr || !vendorRow?.id) {
      return jsonError("Vendor not found", 404);
    }

    const { error: insertErr } = await supabaseServerClient
      .from("vendor_users")
      .insert({ user_id: userId, vendor_id: vendorId });

    if (insertErr) {
      const code = (insertErr as any)?.code;
      if (code === "23505") {
        return jsonOk({ success: true, alreadyLinked: true });
      }
      logError("Failed to link vendor user", insertErr, {
        adminUserId: auth.user.id,
        targetEmail: email,
        vendorId,
      });
      return jsonError("Failed to link user to vendor", 500);
    }

    return jsonOk({ success: true, alreadyLinked: false });
  } catch (error) {
    logError("Unexpected error linking vendor user", error);
    return jsonError("Internal server error", 500);
  }
}
