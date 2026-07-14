import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";
import { validateRequest, uuidSchema } from "@/lib/validation";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const documentBodySchema = z.object({
  documentType: z.enum(["tin", "business_license", "nida", "other"]),
  fileUrl: z.string().url("Invalid file URL"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const rateLimitResponse = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitResponse) return rateLimitResponse;

    const auth = request.headers.get("authorization");
    if (!auth) {
      return jsonError("Unauthorized", 401);
    }

    const { data: userData, error: userError } = await supabaseServerClient.auth.getUser(
      auth.replace("Bearer ", "")
    );
    if (userError || !userData.user) {
      return jsonError("Unauthorized", 401);
    }
    const userId = userData.user.id;
    const vendorId = params.vendorId;

    const { data: vendorLink, error: linkError } = await supabaseServerClient
      .from("vendor_users")
      .select("vendor_id")
      .eq("vendor_id", vendorId)
      .eq("user_id", userId)
      .maybeSingle();

    const isAdmin = await checkAdmin(userId);

    if (linkError) {
      logError("Failed to verify vendor user link", linkError, { vendorId, userId });
      return jsonError("Failed to verify vendor access", 500);
    }

    if (!vendorLink && !isAdmin) {
      return jsonError("Forbidden", 403);
    }

    const validation = await validateRequest(request, { body: documentBodySchema });
    if (!validation.ok) return validation.response;

    const { documentType, fileUrl } = validation.body!;

    const { data, error } = await supabaseServerClient
      .from("vendor_documents")
      .insert({
        vendor_id: vendorId,
        document_type: documentType,
        file_url: fileUrl,
        status: "pending",
        uploaded_by: userId,
      })
      .select("id")
      .single();

    if (error || !data) {
      logError("Failed to upload vendor document", error ?? new Error("No data"), { vendorId });
      return jsonError("Failed to upload document", 500);
    }

    return jsonOk({
      success: true,
      documentId: data.id,
      message: "Document uploaded and pending review",
    });
  } catch (error) {
    logError("Unexpected error uploading vendor document", error instanceof Error ? error : new Error(String(error)));
    return jsonError("Failed to upload document", 500);
  }
}

async function checkAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabaseServerClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !error && !!data;
}
