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

    return jsonOk({ staff: data });
  } catch (error) {
    logError("Unexpected error in school staff POST", error);
    return jsonError("Internal server error", 500);
  }
}
