import { NextRequest, NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { parseBearerToken } from "@/lib/httpAuth";

export type SchoolAuthSuccess = {
  ok: true;
  user: { id: string; email: string | null };
  schoolId: string;
  role: string;
};

export type SchoolAuthFailure = {
  ok: false;
  response: NextResponse;
};

export type SchoolAuthResult = SchoolAuthSuccess | SchoolAuthFailure;

export async function requireSchoolUser(
  request: NextRequest,
): Promise<SchoolAuthResult> {
  const token = parseBearerToken(request.headers.get("authorization"));
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  const { data: userData, error: userError } =
    await supabaseServerClient.auth.getUser(token);

  const user = userData?.user ?? null;
  if (userError || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  const requestedSchoolId = request.headers.get("x-school-id");
  const { data: schoolUsers, error: schoolUserError } = await supabaseServerClient
    .from("school_users")
    .select("school_id, role")
    .eq("user_id", user.id);

  if (schoolUserError) {
    console.error("Error checking school user", schoolUserError);
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Failed to verify school access" },
        { status: 500 },
      ),
    };
  }

  if (!schoolUsers || schoolUsers.length === 0) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No school linked to this account" },
        { status: 403 },
      ),
    };
  }

  const schoolUser =
    (requestedSchoolId
      ? schoolUsers.find((row) => row.school_id === requestedSchoolId)
      : null) ?? schoolUsers[0];

  return {
    ok: true,
    user: { id: user.id, email: user.email ?? null },
    schoolId: schoolUser.school_id,
    role: schoolUser.role,
  };
}

export async function requireAuthenticatedUser(
  request: NextRequest,
): Promise<
  | { ok: true; user: { id: string; email: string | null } }
  | { ok: false; response: NextResponse }
> {
  const token = parseBearerToken(request.headers.get("authorization"));
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  const { data: userData, error: userError } =
    await supabaseServerClient.auth.getUser(token);

  const user = userData?.user ?? null;
  if (userError || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  return {
    ok: true,
    user: { id: user.id, email: user.email ?? null },
  };
}

export function canManageSchoolSettings(role: string) {
  return role === "admin";
}

export function canManageSchoolUsers(role: string) {
  return role === "admin";
}

export function canManageClasses(role: string) {
  return role === "admin";
}

export function canManageStudents(role: string) {
  return role === "admin" || role === "teacher";
}

export function canManageStaff(role: string) {
  return role === "admin" || role === "staff";
}

export function canManageAttendance(role: string) {
  return role === "admin" || role === "teacher";
}

export function canManageFees(role: string) {
  return role === "admin" || role === "staff";
}

export function canManageAnnouncements(role: string) {
  return role === "admin" || role === "staff";
}

export function forbiddenSchoolAction(message = "You do not have permission to perform this school action") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function writeSchoolAuditLog(input: {
  schoolId: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabaseServerClient.from("school_audit_logs").insert({
    school_id: input.schoolId,
    actor_user_id: input.actorUserId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("Failed to write school audit log", error);
  }
}
