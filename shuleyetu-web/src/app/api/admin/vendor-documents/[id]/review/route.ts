import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";
import { requireAdmin } from "@/lib/adminAuth";
import { validateRequest } from "@/lib/validation";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const reviewBodySchema = z.object({
  status: z.enum(["approved", "rejected"]),
  notes: z.string().max(1000).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResponse = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitResponse) return rateLimitResponse;

    const adminCheck = await requireAdmin(request);
    if (!adminCheck.ok) return adminCheck.response;
    const adminId = adminCheck.user.id;

    const validation = await validateRequest(request, { body: reviewBodySchema });
    if (!validation.ok) return validation.response;

    const { status, notes } = validation.body!;
    const documentId = params.id;

    const { data: doc, error: docError } = await supabaseServerClient
      .from("vendor_documents")
      .select("id, vendor_id, document_type, status")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      return jsonError("Document not found", 404);
    }

    const { error: updateError } = await supabaseServerClient
      .from("vendor_documents")
      .update({
        status,
        notes: notes ?? null,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    if (updateError) {
      logError("Failed to review vendor document", updateError, { documentId });
      return jsonError("Failed to update document status", 500);
    }

    await supabaseServerClient.rpc("log_audit", {
      p_entity_type: "vendor",
      p_entity_id: doc.vendor_id,
      p_actor_type: "admin",
      p_actor_user_id: adminId,
      p_action: `vendor_document_${status}`,
      p_payload: {
        vendor_id: doc.vendor_id,
        document_id: documentId,
        document_type: doc.document_type,
        notes: notes ?? null,
      },
    });

    return jsonOk({ success: true, documentId, status });
  } catch (error) {
    logError("Unexpected error reviewing vendor document", error instanceof Error ? error : new Error(String(error)));
    return jsonError("Failed to review document", 500);
  }
}
