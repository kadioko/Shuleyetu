import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { canManageStaff, forbiddenSchoolAction, requireSchoolUser, writeSchoolAuditLog } from "@/lib/schoolAuth";
import { jsonError, jsonOk, readJsonBody } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;
    if (!canManageStaff(auth.role)) return forbiddenSchoolAction("Only admins and staff can add staff records");

    const { data, error } = await supabaseServerClient
      .from("school_staff")
      .select(
        "id, employee_id, first_name, last_name, email, phone, role, subject, status, created_at",
      )
      .eq("school_id", auth.schoolId)
      .order("first_name", { ascending: true });

    if (error) {
      logError("Error loading school staff", error, {
        schoolId: auth.schoolId,
      });
      return jsonError("Failed to load staff", 500);
    }

    return jsonOk({ staff: data ?? [] });
  } catch (error) {
    logError("Unexpected error in school staff GET", error);
    return jsonError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;

    const body = await readJsonBody<{
      employee_id?: string;
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
      role?: string;
      subject?: string;
    }>(request);

    const firstName = body?.first_name?.trim();
    const lastName = body?.last_name?.trim();
    const role = body?.role?.trim();

    if (!firstName || !lastName) {
      return jsonError("First and last name are required", 400);
    }

    const validRole = ["admin", "teacher", "support"].includes(role ?? "")
      ? (role as "admin" | "teacher" | "support")
      : "teacher";

    const { data, error } = await supabaseServerClient
      .from("school_staff")
      .insert({
        school_id: auth.schoolId,
        employee_id: body?.employee_id?.trim() ?? null,
        first_name: firstName,
        last_name: lastName,
        email: body?.email?.trim() ?? null,
        phone: body?.phone?.trim() ?? null,
        role: validRole,
        subject: body?.subject?.trim() ?? null,
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
    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;
    if (!canManageStaff(auth.role)) return forbiddenSchoolAction("Only admins and staff can update staff records");

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("id");
    if (!staffId) return jsonError("Staff id is required", 400);

    const body = await readJsonBody<{
      status?: string;
      first_name?: string;
      last_name?: string;
      employee_id?: string;
      email?: string;
      phone?: string;
      role?: string;
      subject?: string;
    }>(request);

    const validStatuses = ["active", "inactive"];
    if (body?.status !== undefined && !validStatuses.includes(body.status)) {
      return jsonError(`Status must be one of: ${validStatuses.join(", ")}`, 400);
    }

    const validRoles = ["admin", "teacher", "support"];
    if (body?.role !== undefined && !validRoles.includes(body.role)) {
      return jsonError(`Role must be one of: ${validRoles.join(", ")}`, 400);
    }

    // Build updates object from only provided fields
    const updates: Record<string, unknown> = {};
    if (body?.status !== undefined) updates.status = body.status;
    if (body?.first_name !== undefined) updates.first_name = body.first_name.trim();
    if (body?.last_name !== undefined) updates.last_name = body.last_name.trim();
    if (body?.employee_id !== undefined) updates.employee_id = body.employee_id.trim() || null;
    if (body?.email !== undefined) updates.email = body.email.trim() || null;
    if (body?.phone !== undefined) updates.phone = body.phone.trim() || null;
    if (body?.role !== undefined) updates.role = body.role;
    if (body?.subject !== undefined) updates.subject = body.subject.trim() || null;

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
