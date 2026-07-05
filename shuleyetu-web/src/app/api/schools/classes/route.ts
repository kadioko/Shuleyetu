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
