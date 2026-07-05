import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { requireSchoolUser } from "@/lib/schoolAuth";
import { jsonError, jsonOk, readJsonBody } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

    if (!classId) {
      return jsonError("classId query parameter is required", 400);
    }

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
    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;

    const body = await readJsonBody<{
      student_id?: string;
      class_id?: string;
      attendance_date?: string;
      status?: string;
      notes?: string;
    }>(request);

    const studentId = body?.student_id?.trim();
    const classId = body?.class_id?.trim();
    const date = body?.attendance_date?.trim();
    const status = body?.status?.trim();

    if (!studentId || !classId || !date || !status) {
      return jsonError(
        "student_id, class_id, attendance_date and status are required",
        400,
      );
    }

    if (!["present", "absent", "late", "excused"].includes(status)) {
      return jsonError("Invalid attendance status", 400);
    }

    const { data, error } = await supabaseServerClient
      .from("school_attendance")
      .upsert(
        {
          school_id: auth.schoolId,
          student_id: studentId,
          class_id: classId,
          attendance_date: date,
          status: status as "present" | "absent" | "late" | "excused",
          notes: body?.notes?.trim() ?? null,
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

    return jsonOk({ attendance: data });
  } catch (error) {
    logError("Unexpected error in school attendance POST", error);
    return jsonError("Internal server error", 500);
  }
}
