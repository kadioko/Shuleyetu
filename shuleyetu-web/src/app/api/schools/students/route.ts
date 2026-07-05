import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { canManageStudents, forbiddenSchoolAction, requireSchoolUser, writeSchoolAuditLog } from "@/lib/schoolAuth";
import { jsonError, jsonOk, readJsonBody } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;
    if (!canManageStudents(auth.role)) return forbiddenSchoolAction("Only admins and teachers can add students");

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const status = searchParams.get("status") ?? "active";

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
      .order("last_name", { ascending: true });

    if (error) {
      logError("Error loading school students", error, {
        schoolId: auth.schoolId,
      });
      return jsonError("Failed to load students", 500);
    }

    return jsonOk({ students: data ?? [] });
  } catch (error) {
    logError("Unexpected error in school students GET", error);
    return jsonError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;

    const body = await readJsonBody<{
      admission_number?: string;
      first_name?: string;
      last_name?: string;
      gender?: string;
      date_of_birth?: string;
      class_id?: string;
      parent_name?: string;
      parent_phone?: string;
      parent_email?: string;
      address?: string;
      enrollment_date?: string;
    }>(request);

    const admissionNumber = body?.admission_number?.trim();
    const firstName = body?.first_name?.trim();
    const lastName = body?.last_name?.trim();

    if (!admissionNumber || !firstName || !lastName) {
      return jsonError(
        "Admission number, first name and last name are required",
        400,
      );
    }

    const { data, error } = await supabaseServerClient
      .from("school_students")
      .insert({
        school_id: auth.schoolId,
        admission_number: admissionNumber,
        first_name: firstName,
        last_name: lastName,
        gender: ["male", "female", "other"].includes(body?.gender ?? "")
          ? (body?.gender as "male" | "female" | "other")
          : null,
        date_of_birth: body?.date_of_birth ?? null,
        class_id: body?.class_id ?? null,
        parent_name: body?.parent_name?.trim() ?? null,
        parent_phone: body?.parent_phone?.trim() ?? null,
        parent_email: body?.parent_email?.trim() ?? null,
        address: body?.address?.trim() ?? null,
        enrollment_date: body?.enrollment_date ?? null,
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
