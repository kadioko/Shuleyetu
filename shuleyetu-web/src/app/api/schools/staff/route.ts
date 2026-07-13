import { NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { canManageStaff, forbiddenSchoolAction, requireSchoolUser, writeSchoolAuditLog } from "@/lib/schoolAuth";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { validateRequest, paginationSchema, uuidSchema } from "@/lib/validation";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const staffRoleSchema = z.enum(["admin", "teacher", "support"]);
const staffStatusSchema = z.enum(["active", "inactive"]);

const getStaffQuerySchema = paginationSchema;

const createStaffBodySchema = z.object({
  employee_id: z.string().max(50).optional(),
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  email: z.string().email().max(254).optional(),
  phone: z.string().max(50).optional(),
  role: staffRoleSchema.default("teacher"),
  subject: z.string().max(100).optional(),
});

const staffIdQuerySchema = z.object({
  id: uuidSchema,
});

const updateStaffBodySchema = z.object({
  status: staffStatusSchema.optional(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  employee_id: z.string().max(50).optional(),
  email: z.string().email().max(254).optional(),
  phone: z.string().max(50).optional(),
  role: staffRoleSchema.optional(),
  subject: z.string().max(100).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const rateLimitError = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitError) return rateLimitError;

    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;
    // All school users can view staff (write permissions checked in POST/PATCH only)

    const validated = await validateRequest(request, {
      query: getStaffQuerySchema,
    });
    if (!validated.ok) return validated.response;
    const { page, limit } = validated.query!;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await supabaseServerClient
      .from("school_staff")
      .select(
        "id, employee_id, first_name, last_name, email, phone, role, subject, status, created_at",
      )
      .eq("school_id", auth.schoolId)
      .order("first_name", { ascending: true })
      .range(from, to);

    if (error) {
      logError("Error loading school staff", error, {
        schoolId: auth.schoolId,
      });
      return jsonError("Failed to load staff", 500);
    }

    return jsonOk({ staff: data ?? [], page, limit, hasMore: (data?.length ?? 0) === limit });
  } catch (error) {
    logError("Unexpected error in school staff GET", error);
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
      body: createStaffBodySchema,
    });
    if (!validated.ok) return validated.response;
    const body = validated.body!;

    const { data, error } = await supabaseServerClient
      .from("school_staff")
      .insert({
        school_id: auth.schoolId,
        employee_id: body.employee_id?.trim() ?? null,
        first_name: body.first_name.trim(),
        last_name: body.last_name.trim(),
        email: body.email?.trim() ?? null,
        phone: body.phone?.trim() ?? null,
        role: body.role,
        subject: body.subject?.trim() ?? null,
      })
      .select(
        "id, employee_id, first_name, last_name, email, phone, role, subject, status, created_at",
      )
      .single();

    if (error || !data) {
      logError("Error creating school staff", error, {
        schoolId: auth.schoolId,
      });
      return jsonError("Failed to create staff", 500);
    }

    await writeSchoolAuditLog({
      schoolId: auth.schoolId,
      actorUserId: auth.user.id,
      action: "created",
      entityType: "staff",
      entityId: data.id,
      metadata: { name: `${data.first_name} ${data.last_name}`, role: data.role },
    });

    return jsonOk({ staff: data });
  } catch (error) {
    logError("Unexpected error in school staff POST", error);
    return jsonError("Internal server error", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const rateLimitError = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitError) return rateLimitError;

    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;
    if (!canManageStaff(auth.role)) return forbiddenSchoolAction("Only admins and staff can update staff records");

    const validated = await validateRequest(request, {
      query: staffIdQuerySchema,
      body: updateStaffBodySchema,
    });
    if (!validated.ok) return validated.response;
    const { id: staffId } = validated.query!;
    const body = validated.body!;

    // Build updates object from only provided fields
    const updates: Record<string, unknown> = {};
    if (body.status !== undefined) updates.status = body.status;
    if (body.first_name !== undefined) updates.first_name = body.first_name.trim();
    if (body.last_name !== undefined) updates.last_name = body.last_name.trim();
    if (body.employee_id !== undefined) updates.employee_id = body.employee_id.trim() || null;
    if (body.email !== undefined) updates.email = body.email.trim() || null;
    if (body.phone !== undefined) updates.phone = body.phone.trim() || null;
    if (body.role !== undefined) updates.role = body.role;
    if (body.subject !== undefined) updates.subject = body.subject.trim() || null;

    if (Object.keys(updates).length === 0) {
      return jsonError("No fields to update", 400);
    }

    const { data, error } = await supabaseServerClient
      .from("school_staff")
      .update(updates)
      .eq("id", staffId)
      .eq("school_id", auth.schoolId)
      .select(
        "id, employee_id, first_name, last_name, email, phone, role, subject, status, created_at",
      )
      .single();

    if (error || !data) {
      logError("Error updating staff", error, { schoolId: auth.schoolId });
      return jsonError("Failed to update staff", 500);
    }

    await writeSchoolAuditLog({
      schoolId: auth.schoolId,
      actorUserId: auth.user.id,
      action: "updated",
      entityType: "staff",
      entityId: data.id,
      metadata: updates,
    });

    return jsonOk({ staff: data });
  } catch (error) {
    logError("Unexpected error in school staff PATCH", error);
    return jsonError("Internal server error", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const rateLimitError = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitError) return rateLimitError;

    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;
    if (!canManageStaff(auth.role)) return forbiddenSchoolAction("Only admins and staff managers can delete staff records");

    const validated = await validateRequest(request, {
      query: staffIdQuerySchema,
    });
    if (!validated.ok) return validated.response;
    const { id: staffId } = validated.query!;

    const { error } = await supabaseServerClient
      .from("school_staff")
      .delete()
      .eq("id", staffId)
      .eq("school_id", auth.schoolId);

    if (error) {
      logError("Error deleting school staff", error, { schoolId: auth.schoolId });
      return jsonError("Failed to delete staff", 500);
    }

    await writeSchoolAuditLog({
      schoolId: auth.schoolId,
      actorUserId: auth.user.id,
      action: "deleted",
      entityType: "staff",
      entityId: staffId,
      metadata: {},
    });

    return jsonOk({ deleted: true });
  } catch (error) {
    logError("Unexpected error in school staff DELETE", error);
    return jsonError("Internal server error", 500);
  }
}
