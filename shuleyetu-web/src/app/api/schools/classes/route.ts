import { NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { canManageClasses, forbiddenSchoolAction, requireSchoolUser, writeSchoolAuditLog } from "@/lib/schoolAuth";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { validateRequest, paginationSchema, uuidSchema } from "@/lib/validation";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const getClassesQuerySchema = paginationSchema;

const createClassBodySchema = z.object({
  name: z.string().min(1, "Class name is required").max(100),
  grade: z.string().max(50).optional(),
  stream: z.string().max(50).optional(),
  room: z.string().max(50).optional(),
  capacity: z.coerce.number().int().min(1).optional(),
});

const classIdQuerySchema = z.object({
  id: uuidSchema,
});

const updateClassBodySchema = z.object({
  name: z.string().min(1, "Class name cannot be empty").max(100).optional(),
  grade: z.string().max(50).nullable().optional(),
  stream: z.string().max(50).nullable().optional(),
  room: z.string().max(50).nullable().optional(),
  capacity: z.coerce.number().int().min(1).nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const rateLimitError = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitError) return rateLimitError;

    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;
    // All school users can view classes (write permissions checked in POST/PATCH/DELETE only)

    const validated = await validateRequest(request, {
      query: getClassesQuerySchema,
    });
    if (!validated.ok) return validated.response;
    const { page, limit } = validated.query!;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await supabaseServerClient
      .from("school_classes")
      .select("id, name, grade, stream, room, capacity, created_at")
      .eq("school_id", auth.schoolId)
      .order("grade", { ascending: true })
      .order("name", { ascending: true })
      .range(from, to);

    if (error) {
      logError("Error loading school classes", error, {
        schoolId: auth.schoolId,
      });
      return jsonError("Failed to load classes", 500);
    }

    return jsonOk({ classes: data ?? [], page, limit, hasMore: (data?.length ?? 0) === limit });
  } catch (error) {
    logError("Unexpected error in school classes GET", error);
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
      body: createClassBodySchema,
    });
    if (!validated.ok) return validated.response;
    const body = validated.body!;

    const { data, error } = await supabaseServerClient
      .from("school_classes")
      .insert({
        school_id: auth.schoolId,
        name: body.name,
        grade: body.grade?.trim() ?? null,
        stream: body.stream?.trim() ?? null,
        room: body.room?.trim() ?? null,
        capacity: body.capacity ?? null,
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
    const rateLimitError = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitError) return rateLimitError;

    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;
    if (!canManageClasses(auth.role)) return forbiddenSchoolAction("Only school admins can update classes");

    const validated = await validateRequest(request, {
      query: classIdQuerySchema,
      body: updateClassBodySchema,
    });
    if (!validated.ok) return validated.response;
    const { id: classId } = validated.query!;
    const body = validated.body!;

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.grade !== undefined) updates.grade = body.grade?.trim() ?? null;
    if (body.stream !== undefined) updates.stream = body.stream?.trim() ?? null;
    if (body.room !== undefined) updates.room = body.room?.trim() ?? null;
    if (body.capacity !== undefined) updates.capacity = body.capacity ?? null;

    if (Object.keys(updates).length === 0) {
      return jsonError("No fields provided to update", 400);
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
    const rateLimitError = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitError) return rateLimitError;

    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;
    if (!canManageClasses(auth.role)) return forbiddenSchoolAction("Only school admins can delete classes");

    const validated = await validateRequest(request, {
      query: classIdQuerySchema,
    });
    if (!validated.ok) return validated.response;
    const { id: classId } = validated.query!;

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
