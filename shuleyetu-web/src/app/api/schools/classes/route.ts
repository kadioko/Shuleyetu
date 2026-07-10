import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { canManageClasses, forbiddenSchoolAction, requireSchoolUser, writeSchoolAuditLog } from "@/lib/schoolAuth";
import { jsonError, jsonOk, readJsonBody } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;
    if (!canManageClasses(auth.role)) return forbiddenSchoolAction("Only school admins can create classes");

    const { data, error } = await supabaseServerClient
      .from("school_classes")
      .select("id, name, grade, stream, room, capacity, created_at")
      .eq("school_id", auth.schoolId)
      .order("grade", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      logError("Error loading school classes", error, {
        schoolId: auth.schoolId,
      });
      return jsonError("Failed to load classes", 500);
    }

    return jsonOk({ classes: data ?? [] });
  } catch (error) {
    logError("Unexpected error in school classes GET", error);
    return jsonError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;

    const body = await readJsonBody<{
      name?: string;
      grade?: string;
      stream?: string;
      room?: string;
      capacity?: number;
    }>(request);

    const name = body?.name?.trim();
    if (!name) {
      return jsonError("Class name is required", 400);
    }

    const { data, error } = await supabaseServerClient
      .from("school_classes")
      .insert({
        school_id: auth.schoolId,
        name,
        grade: body?.grade?.trim() ?? null,
        stream: body?.stream?.trim() ?? null,
        room: body?.room?.trim() ?? null,
        capacity: body?.capacity ?? null,
      })
      .select("id, name, grade, stream, room, capacity, created_at")
      .single();

    if (error || !data) {
      logError("Error creating school class", error, {
        schoolId: auth.schoolId,
      });
      return jsonError("Failed to create class", 500);
    }

    await writeSchoolAuditLog({
      schoolId: auth.schoolId,
      actorUserId: auth.user.id,
      action: "created",
      entityType: "class",
      entityId: data.id,
      metadata: { name: data.name },
    });

    return jsonOk({ class: data });
  } catch (error) {
    logError("Unexpected error in school classes POST", error);
    return jsonError("Internal server error", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;
    if (!canManageClasses(auth.role)) return forbiddenSchoolAction("Only school admins can update classes");

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("id");
    if (!classId) return jsonError("Class id is required", 400);

    const body = await readJsonBody<{
      name?: string;
      grade?: string | null;
      stream?: string | null;
      room?: string | null;
      capacity?: number | null;
    }>(request);

    const updates: Record<string, unknown> = {};
    if (body?.name !== undefined) updates.name = body.name?.trim();
    if (body?.grade !== undefined) updates.grade = body.grade?.trim() ?? null;
    if (body?.stream !== undefined) updates.stream = body.stream?.trim() ?? null;
    if (body?.room !== undefined) updates.room = body.room?.trim() ?? null;
    if (body?.capacity !== undefined) updates.capacity = body.capacity ?? null;

    if (!updates.name && updates.name !== undefined) {
      return jsonError("Class name cannot be empty", 400);
    }

    const { data, error } = await supabaseServerClient
      .from("school_classes")
      .update(updates)
      .eq("id", classId)
      .eq("school_id", auth.schoolId)
      .select("id, name, grade, stream, room, capacity, created_at")
      .single();

    if (error || !data) {
      logError("Error updating school class", error, { schoolId: auth.schoolId });
      return jsonError("Failed to update class", 500);
    }

    await writeSchoolAuditLog({
      schoolId: auth.schoolId,
      actorUserId: auth.user.id,
      action: "updated",
      entityType: "class",
      entityId: data.id,
      metadata: { name: data.name },
    });

    return jsonOk({ class: data });
  } catch (error) {
    logError("Unexpected error in school classes PATCH", error);
    return jsonError("Internal server error", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;
    if (!canManageClasses(auth.role)) return forbiddenSchoolAction("Only school admins can delete classes");

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("id");
    if (!classId) return jsonError("Class id is required", 400);

    const { error } = await supabaseServerClient
      .from("school_classes")
      .delete()
      .eq("id", classId)
      .eq("school_id", auth.schoolId);

    if (error) {
      logError("Error deleting school class", error, { schoolId: auth.schoolId });
      return jsonError("Failed to delete class", 500);
    }

    await writeSchoolAuditLog({
      schoolId: auth.schoolId,
      actorUserId: auth.user.id,
      action: "deleted",
      entityType: "class",
      entityId: classId,
      metadata: {},
    });

    return jsonOk({ ok: true });
  } catch (error) {
    logError("Unexpected error in school classes DELETE", error);
    return jsonError("Internal server error", 500);
  }
}
