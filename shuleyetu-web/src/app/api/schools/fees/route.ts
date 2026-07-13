import { NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { canManageFees, forbiddenSchoolAction, requireSchoolUser, writeSchoolAuditLog } from "@/lib/schoolAuth";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { validateRequest, paginationSchema, uuidSchema } from "@/lib/validation";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const feeStatusSchema = z.enum(["pending", "partial", "paid", "cancelled"]);

const getFeesQuerySchema = paginationSchema.extend({
  status: feeStatusSchema.optional(),
  studentId: uuidSchema.optional(),
});

const createFeeBodySchema = z.object({
  student_id: uuidSchema,
  description: z.string().min(1, "Description is required").max(500),
  amount_tzs: z.coerce.number().positive("Amount must be greater than 0"),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional(),
});

export async function GET(request: NextRequest) {
  try {
    const rateLimitError = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitError) return rateLimitError;

    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;
    // All school users can view fees (write permissions checked in POST only)

    const validated = await validateRequest(request, {
      query: getFeesQuerySchema,
    });
    if (!validated.ok) return validated.response;
    const { page, limit, status, studentId } = validated.query!;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseServerClient
      .from("school_fees")
      .select(
        "id, student_id, description, amount_tzs, due_date, status, created_at, school_students(admission_number, first_name, last_name)",
      )
      .eq("school_id", auth.schoolId);

    if (status) {
      query = query.eq("status", status);
    }
    if (studentId) {
      query = query.eq("student_id", studentId);
    }

    const { data: fees, error: feesError } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (feesError) {
      logError("Error loading school fees", feesError, {
        schoolId: auth.schoolId,
      });
      return jsonError("Failed to load fees", 500);
    }

    const feeIds = (fees ?? []).map((f) => f.id);
    const { data: payments, error: paymentsError } = await supabaseServerClient
      .from("school_fee_payments")
      .select("fee_id, amount_tzs")
      .in("fee_id", feeIds.length ? feeIds : ["00000000-0000-0000-0000-000000000000"]);

    if (paymentsError) {
      logError("Error loading school fee payments", paymentsError, {
        schoolId: auth.schoolId,
      });
    }

    const paymentsByFee = (payments ?? []).reduce<Record<string, number>>(
      (acc, p) => {
        acc[p.fee_id] = (acc[p.fee_id] || 0) + Number(p.amount_tzs || 0);
        return acc;
      },
      {},
    );

    const feesWithPayments = (fees ?? []).map((fee) => ({
      ...fee,
      paid_tzs: paymentsByFee[fee.id] || 0,
      balance_tzs: Math.max(
        0,
        Number(fee.amount_tzs || 0) - (paymentsByFee[fee.id] || 0),
      ),
    }));

    return jsonOk({ fees: feesWithPayments, page, limit, hasMore: (fees?.length ?? 0) === limit });
  } catch (error) {
    logError("Unexpected error in school fees GET", error);
    return jsonError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitError = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitError) return rateLimitError;

    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;

    const validated = await validateRequest(request, {
      body: createFeeBodySchema,
    });
    if (!validated.ok) return validated.response;
    const body = validated.body!;

    const { data, error } = await supabaseServerClient
      .from("school_fees")
      .insert({
        school_id: auth.schoolId,
        student_id: body.student_id,
        description: body.description,
        amount_tzs: body.amount_tzs,
        due_date: body.due_date ?? null,
      })
      .select(
        "id, student_id, description, amount_tzs, due_date, status, created_at, school_students(admission_number, first_name, last_name)",
      )
      .single();

    if (error || !data) {
      logError("Error creating school fee", error, {
        schoolId: auth.schoolId,
      });
      return jsonError("Failed to create fee", 500);
    }

    await writeSchoolAuditLog({
      schoolId: auth.schoolId,
      actorUserId: auth.user.id,
      action: "created",
      entityType: "fee",
      entityId: data.id,
      metadata: { student_id: data.student_id, amount_tzs: data.amount_tzs, description: data.description },
    });

    return jsonOk({ fee: { ...data, paid_tzs: 0, balance_tzs: Number(data.amount_tzs || 0) } });
  } catch (error) {
    logError("Unexpected error in school fees POST", error);
    return jsonError("Internal server error", 500);
  }
}
