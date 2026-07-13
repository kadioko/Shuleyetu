import { NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { canManageFees, forbiddenSchoolAction, requireSchoolUser, writeSchoolAuditLog } from "@/lib/schoolAuth";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { validateRequest, uuidSchema } from "@/lib/validation";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const recordPaymentBodySchema = z.object({
  fee_id: uuidSchema,
  amount_tzs: z.coerce.number().positive("Amount must be greater than 0"),
  payment_method: z.string().trim().min(1, "Payment method is required").default("cash"),
  reference: z.string().max(100).nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const rateLimitError = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitError) return rateLimitError;

    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;
    if (!canManageFees(auth.role)) return forbiddenSchoolAction("Only admins and staff can record fee payments");

    const validated = await validateRequest(request, {
      body: recordPaymentBodySchema,
    });
    if (!validated.ok) return validated.response;
    const body = validated.body!;

    const feeId = body.fee_id;
    const amount = body.amount_tzs;
    const method = body.payment_method;

    // Verify the fee belongs to this school
    const { data: fee, error: feeError } = await supabaseServerClient
      .from("school_fees")
      .select("id, amount_tzs, status")
      .eq("id", feeId)
      .eq("school_id", auth.schoolId)
      .single();

    if (feeError || !fee) {
      return jsonError("Fee not found", 404);
    }

    // Validate payment doesn't exceed remaining balance
    const { data: existingPayments } = await supabaseServerClient
      .from("school_fee_payments")
      .select("amount_tzs")
      .eq("fee_id", feeId);

    const totalPaidSoFar = (existingPayments ?? []).reduce((s, p) => s + Number(p.amount_tzs), 0);
    const remainingBalance = Number(fee.amount_tzs) - totalPaidSoFar;

    if (amount > remainingBalance) {
      return jsonError(
        `Payment amount TZS ${amount.toLocaleString()} exceeds remaining balance TZS ${remainingBalance.toLocaleString()}`,
        400,
      );
    }

    // Insert payment
    const { data: payment, error: payError } = await supabaseServerClient
      .from("school_fee_payments")
      .insert({
        school_id: auth.schoolId,
        fee_id: feeId,
        amount_tzs: amount,
        payment_method: method,
        reference: body.reference ?? null,
      })
      .select("id, fee_id, amount_tzs, payment_method, reference, created_at")
      .single();

    if (payError || !payment) {
      logError("Error recording fee payment", payError, { schoolId: auth.schoolId });
      return jsonError("Failed to record payment", 500);
    }

    // Recalculate total paid and update fee status
    const { data: allPayments } = await supabaseServerClient
      .from("school_fee_payments")
      .select("amount_tzs")
      .eq("fee_id", feeId);

    const totalPaid = (allPayments ?? []).reduce((s, p) => s + Number(p.amount_tzs), 0);
    const feeAmount = Number(fee.amount_tzs);
    const newStatus = totalPaid >= feeAmount ? "paid" : totalPaid > 0 ? "partial" : "pending";

    await supabaseServerClient
      .from("school_fees")
      .update({ status: newStatus })
      .eq("id", feeId);

    await writeSchoolAuditLog({
      schoolId: auth.schoolId,
      actorUserId: auth.user.id,
      action: "payment_recorded",
      entityType: "fee",
      entityId: feeId,
      metadata: { amount_tzs: amount, payment_method: method, new_status: newStatus },
    });

    return jsonOk({ payment, fee_status: newStatus, total_paid: totalPaid });
  } catch (error) {
    logError("Unexpected error in school payments POST", error);
    return jsonError("Internal server error", 500);
  }
}
