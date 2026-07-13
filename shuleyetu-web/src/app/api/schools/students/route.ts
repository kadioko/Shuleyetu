import { NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { canManageStudents, forbiddenSchoolAction, requireSchoolUser, writeSchoolAuditLog } from "@/lib/schoolAuth";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { validateRequest, paginationSchema, uuidSchema } from "@/lib/validation";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const studentGenderSchema = z.enum(["male", "female", "other"]);
const studentStatusSchema = z.enum(["active", "inactive", "transferred"]);
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional();

const getStudentsQuerySchema = paginationSchema.extend({
  classId: uuidSchema.optional(),
  status: studentStatusSchema.default("active"),
});

const createStudentBodySchema = z.object({
  admission_number: z.string().min(1, "Admission number is required").max(50),
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  gender: studentGenderSchema.optional(),
  date_of_birth: dateStringSchema,
  class_id: uuidSchema.optional(),
  parent_name: z.string().max(200).optional(),
  parent_phone: z.string().max(50).optional(),
  parent_email: z.string().email().max(254).optional(),
  address: z.string().max(500).optional(),
  enrollment_date: dateStringSchema,
});

const studentIdQuerySchema = z.object({
  id: uuidSchema,
});

const updateStudentBodySchema = z.object({
  status: studentStatusSchema.optional(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  gender: studentGenderSchema.optional(),
  date_of_birth: dateStringSchema,
  class_id: uuidSchema.optional(),
  parent_name: z.string().max(200).optional(),
  parent_phone: z.string().max(50).optional(),
  parent_email: z.string().email().max(254).optional(),
  address: z.string().max(500).optional(),
  enrollment_date: dateStringSchema,
});

export async function GET(request: NextRequest) {
  try {
    const rateLimitError = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitError) return rateLimitError;

    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;
    if (!canManageStudents(auth.role)) return forbiddenSchoolAction("Only admins and teachers can add students");

    const validated = await validateRequest(request, {
      query: getStudentsQuerySchema,
    });
    if (!validated.ok) return validated.response;
    const { page, limit, classId, status } = validated.query!;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseServerClient
      .from("school_students")
      .select(
        "id, admission_number, first_name, last_name, gender, date_of_birth, class_id, parent_name, parent_phone, parent_email, address, status, enrollment_date, created_at, school_classes(name, grade, stream)",
      )
      .eq("school_id", auth.schoolId);

    if (status) {
      query = query.eq("status", status);
    }
    if (classId) {
      query = query.eq("class_id", classId);
    }

    const { data, error } = await query
      .order("first_name", { ascending: true })
      .order("last_name", { ascending: true })
      .range(from, to);

    if (error) {
      logError("Error loading school students", error, {
        schoolId: auth.schoolId,
      });
      return jsonError("Failed to load students", 500);
    }

    return jsonOk({ students: data ?? [], page, limit, hasMore: (data?.length ?? 0) === limit });
  } catch (error) {
    logError("Unexpected error in school students GET", error);
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
      body: createStudentBodySchema,
    });
    if (!validated.ok) return validated.response;
    const body = validated.body!;

    // Validate class_id belongs to this school if provided
    if (body.class_id) {
      const { data: classCheck } = await supabaseServerClient
        .from("school_classes")
        .select("id")
        .eq("id", body.class_id)
        .eq("school_id", auth.schoolId)
        .single();
      if (!classCheck) {
        return jsonError("Class not found in this school", 400);
      }
    }

    const { data, error } = await supabaseServerClient
      .from("school_students")
      .insert({
        school_id: auth.schoolId,
        admission_number: body.admission_number.trim(),
        first_name: body.first_name.trim(),
        last_name: body.last_name.trim(),
        gender: body.gender ?? null,
        date_of_birth: body.date_of_birth ?? null,
        class_id: body.class_id ?? null,
        parent_name: body.parent_name?.trim() ?? null,
        parent_phone: body.parent_phone?.trim() ?? null,
        parent_email: body.parent_email?.trim() ?? null,
        address: body.address?.trim() ?? null,
        enrollment_date: body.enrollment_date ?? null,
      })
      .select(
        "id, admission_number, first_name, last_name, gender, date_of_birth, class_id, parent_name, parent_phone, parent_email, address, status, enrollment_date, created_at, school_classes(name, grade, stream)",
      )
      .single();

    if (error) {
      const code = (error as { code?: string }).code;
      if (code === "23505") {
        return jsonError("Admission number already exists", 409);
      }
      logError("Error creating school student", error, {
        schoolId: auth.schoolId,
      });
      return jsonError("Failed to create student", 500);
    }

    await writeSchoolAuditLog({
      schoolId: auth.schoolId,
      actorUserId: auth.user.id,
      action: "created",
      entityType: "student",
      entityId: data.id,
      metadata: { admission_number: data.admission_number, name: `${data.first_name} ${data.last_name}` },
    });

    return jsonOk({ student: data });
  } catch (error) {
    logError("Unexpected error in school students POST", error);
    return jsonError("Internal server error", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const rateLimitError = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitError) return rateLimitError;

    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;
    if (!canManageStudents(auth.role)) return forbiddenSchoolAction("Only admins and teachers can update students");

    const validated = await validateRequest(request, {
      query: studentIdQuerySchema,
      body: updateStudentBodySchema,
    });
    if (!validated.ok) return validated.response;
    const { id: studentId } = validated.query!;
    const body = validated.body!;

    // Build updates object from only provided fields
    const updates: Record<string, unknown> = {};
    if (body.status !== undefined) updates.status = body.status;
    if (body.first_name !== undefined) updates.first_name = body.first_name.trim();
    if (body.last_name !== undefined) updates.last_name = body.last_name.trim();
    if (body.gender !== undefined) updates.gender = body.gender ?? null;
    if (body.date_of_birth !== undefined) updates.date_of_birth = body.date_of_birth || null;
    if (body.class_id !== undefined) {
      if (body.class_id) {
        // Validate class belongs to this school
        const { data: classCheck } = await supabaseServerClient
          .from("school_classes")
          .select("id")
          .eq("id", body.class_id)
          .eq("school_id", auth.schoolId)
          .single();
        if (!classCheck) {
          return jsonError("Class not found in this school", 400);
        }
      }
      updates.class_id = body.class_id || null;
    }
    if (body.parent_name !== undefined) updates.parent_name = body.parent_name.trim() || null;
    if (body.parent_phone !== undefined) updates.parent_phone = body.parent_phone.trim() || null;
    if (body.parent_email !== undefined) updates.parent_email = body.parent_email.trim() || null;
    if (body.address !== undefined) updates.address = body.address.trim() || null;
    if (body.enrollment_date !== undefined) updates.enrollment_date = body.enrollment_date || null;

    if (Object.keys(updates).length === 0) {
      return jsonError("No fields to update", 400);
    }

    const { data, error } = await supabaseServerClient
      .from("school_students")
      .update(updates)
      .eq("id", studentId)
      .eq("school_id", auth.schoolId)
      .select(
        "id, admission_number, first_name, last_name, gender, date_of_birth, class_id, parent_name, parent_phone, parent_email, address, status, enrollment_date, created_at, school_classes(name, grade, stream)",
      )
      .single();

    if (error || !data) {
      logError("Error updating student", error, { schoolId: auth.schoolId });
      return jsonError("Failed to update student", 500);
    }

    await writeSchoolAuditLog({
      schoolId: auth.schoolId,
      actorUserId: auth.user.id,
      action: "updated",
      entityType: "student",
      entityId: data.id,
      metadata: updates,
    });

    return jsonOk({ student: data });
  } catch (error) {
    logError("Unexpected error in school students PATCH", error);
    return jsonError("Internal server error", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const rateLimitError = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitError) return rateLimitError;

    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;
    if (!canManageStudents(auth.role)) return forbiddenSchoolAction("Only admins and teachers can delete students");

    const validated = await validateRequest(request, {
      query: studentIdQuerySchema,
    });
    if (!validated.ok) return validated.response;
    const { id: studentId } = validated.query!;

    const { error } = await supabaseServerClient
      .from("school_students")
      .delete()
      .eq("id", studentId)
      .eq("school_id", auth.schoolId);

    if (error) {
      logError("Error deleting school student", error, { schoolId: auth.schoolId });
      return jsonError("Failed to delete student", 500);
    }

    await writeSchoolAuditLog({
      schoolId: auth.schoolId,
      actorUserId: auth.user.id,
      action: "deleted",
      entityType: "student",
      entityId: studentId,
      metadata: {},
    });

    return jsonOk({ deleted: true });
  } catch (error) {
    logError("Unexpected error in school students DELETE", error);
    return jsonError("Internal server error", 500);
  }
}
