import { NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { canManageAttendance, forbiddenSchoolAction, requireSchoolUser, writeSchoolAuditLog } from "@/lib/schoolAuth";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { validateRequest, uuidSchema } from "@/lib/validation";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const attendanceStatusSchema = z.enum(["present", "absent", "late", "excused"]);
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format");

const getAttendanceQuerySchema = z.union([
  z.object({
    studentId: uuidSchema,
    dateFrom: dateStringSchema.optional(),
    dateTo: dateStringSchema.optional(),
  }),
  z.object({
    classId: uuidSchema,
    date: dateStringSchema.optional(),
  }),
]);

const postAttendanceBodySchema = z.object({
  student_id: uuidSchema,
  class_id: uuidSchema,
  attendance_date: dateStringSchema,
  status: attendanceStatusSchema,
  notes: z.string().max(500).optional(),
});

const putAttendanceBodySchema = z.object({
  class_id: uuidSchema,
  attendance_date: dateStringSchema,
  status: attendanceStatusSchema,
  student_ids: z.array(uuidSchema).min(1, "At least one student is required"),
});

export async function GET(request: NextRequest) {
  try {
    const rateLimitError = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitError) return rateLimitError;

    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;
    if (!canManageAttendance(auth.role)) return forbiddenSchoolAction("Only admins and teachers can mark attendance");

    const validated = await validateRequest(request, {
      query: getAttendanceQuerySchema,
    });
    if (!validated.ok) return validated.response;
    const query = validated.query!;

    // Student history mode
    if ("studentId" in query) {
      const now = new Date();
      const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const dateFrom = query.dateFrom ?? defaultFrom;
      const dateTo = query.dateTo ?? now.toISOString().slice(0, 10);

      const { data, error } = await supabaseServerClient
        .from("school_attendance")
        .select("id, attendance_date, status, notes, school_classes(name)")
        .eq("school_id", auth.schoolId)
        .eq("student_id", query.studentId)
        .gte("attendance_date", dateFrom)
        .lte("attendance_date", dateTo)
        .order("attendance_date", { ascending: false });

      if (error) {
        logError("Error loading student attendance history", error, {
          schoolId: auth.schoolId,
        });
        return jsonError("Failed to load attendance history", 500);
      }

      const records = (data ?? []).map((r) => ({
        id: r.id,
        attendance_date: r.attendance_date,
        status: r.status,
        notes: r.notes,
        class_name: (r.school_classes as unknown as { name: string | null } | null)?.name ?? null,
      }));

      return jsonOk({ records });
    }

    // Class attendance mode (existing behavior)
    const classId = query.classId;
    const date = query.date ?? new Date().toISOString().slice(0, 10);

    const { data: students, error: studentsError } = await supabaseServerClient
      .from("school_students")
      .select("id, admission_number, first_name, last_name, class_id")
      .eq("school_id", auth.schoolId)
      .eq("class_id", classId)
      .eq("status", "active")
      .order("first_name", { ascending: true });

    if (studentsError) {
      logError("Error loading students for attendance", studentsError, {
        schoolId: auth.schoolId,
      });
      return jsonError("Failed to load students", 500);
    }

    const { data: attendance, error: attendanceError } = await supabaseServerClient
      .from("school_attendance")
      .select("id, student_id, status, notes")
      .eq("school_id", auth.schoolId)
      .eq("class_id", classId)
      .eq("attendance_date", date);

    if (attendanceError) {
      logError("Error loading attendance records", attendanceError, {
        schoolId: auth.schoolId,
      });
      return jsonError("Failed to load attendance", 500);
    }

    const attendanceMap = new Map(
      (attendance ?? []).map((a) => [a.student_id, a]),
    );

    const studentsWithAttendance = (students ?? []).map((student) => ({
      ...student,
      attendance_id: attendanceMap.get(student.id)?.id ?? null,
      attendance_status: attendanceMap.get(student.id)?.status ?? null,
      notes: attendanceMap.get(student.id)?.notes ?? null,
    }));

    return jsonOk({
      date,
      classId,
      students: studentsWithAttendance,
    });
  } catch (error) {
    logError("Unexpected error in school attendance GET", error);
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
      body: postAttendanceBodySchema,
    });
    if (!validated.ok) return validated.response;
    const body = validated.body!;

    const { data, error } = await supabaseServerClient
      .from("school_attendance")
      .upsert(
        {
          school_id: auth.schoolId,
          student_id: body.student_id,
          class_id: body.class_id,
          attendance_date: body.attendance_date,
          status: body.status,
          notes: body.notes?.trim() ?? null,
        },
        {
          onConflict: "student_id, attendance_date",
        },
      )
      .select("id, student_id, class_id, attendance_date, status, notes")
      .single();

    if (error || !data) {
      logError("Error saving attendance", error, {
        schoolId: auth.schoolId,
      });
      return jsonError("Failed to save attendance", 500);
    }

    await writeSchoolAuditLog({
      schoolId: auth.schoolId,
      actorUserId: auth.user.id,
      action: "marked",
      entityType: "attendance",
      entityId: data.id,
      metadata: { student_id: data.student_id, status: data.status, date: data.attendance_date },
    });

    return jsonOk({ attendance: data });
  } catch (error) {
    logError("Unexpected error in school attendance POST", error);
    return jsonError("Internal server error", 500);
  }
}

// Bulk attendance: mark all students in a class with the same status
export async function PUT(request: NextRequest) {
  try {
    const rateLimitError = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitError) return rateLimitError;

    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;
    if (!canManageAttendance(auth.role)) return forbiddenSchoolAction("Only admins and teachers can mark attendance");

    const validated = await validateRequest(request, {
      body: putAttendanceBodySchema,
    });
    if (!validated.ok) return validated.response;
    const body = validated.body!;

    const records = body.student_ids.map((studentId) => ({
      school_id: auth.schoolId,
      student_id: studentId,
      class_id: body.class_id,
      attendance_date: body.attendance_date,
      status: body.status,
      notes: null,
    }));

    const { error } = await supabaseServerClient
      .from("school_attendance")
      .upsert(records, { onConflict: "student_id, attendance_date" });

    if (error) {
      logError("Error saving bulk attendance", error, { schoolId: auth.schoolId });
      return jsonError("Failed to save bulk attendance", 500);
    }

    await writeSchoolAuditLog({
      schoolId: auth.schoolId,
      actorUserId: auth.user.id,
      action: "bulk_marked",
      entityType: "attendance",
      metadata: { class_id: body.class_id, status: body.status, count: body.student_ids.length, date: body.attendance_date },
    });

    return jsonOk({ ok: true, count: body.student_ids.length });
  } catch (error) {
    logError("Unexpected error in school attendance PUT", error);
    return jsonError("Internal server error", 500);
  }
}
