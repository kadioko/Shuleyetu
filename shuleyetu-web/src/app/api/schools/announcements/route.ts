import { NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { canManageAnnouncements, forbiddenSchoolAction, requireSchoolUser, writeSchoolAuditLog } from "@/lib/schoolAuth";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { validateRequest, paginationSchema, uuidSchema } from "@/lib/validation";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const announcementAudienceSchema = z.enum(["all", "parents", "staff", "students"]);
const announcementStatusSchema = z.enum(["published", "draft"]);

const getAnnouncementsQuerySchema = paginationSchema.extend({
  audience: announcementAudienceSchema.optional(),
});

const createAnnouncementBodySchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required").max(5000),
  audience: announcementAudienceSchema.default("all"),
  status: announcementStatusSchema.default("published"),
  scheduled_at: z.string().datetime().nullable().optional(),
});

const deleteAnnouncementQuerySchema = z.object({
  id: uuidSchema,
});

export async function GET(request: NextRequest) {
  try {
    const rateLimitError = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitError) return rateLimitError;

    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;
    // All school users can view announcements (write permissions checked in POST/DELETE only)

    const validated = await validateRequest(request, {
      query: getAnnouncementsQuerySchema,
    });
    if (!validated.ok) return validated.response;

    const { page, limit, audience } = validated.query!;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseServerClient
      .from("school_announcements")
      .select("id, title, content, audience, status, scheduled_at, created_at, updated_at")
      .eq("school_id", auth.schoolId);

    if (audience) {
      query = query.eq("audience", audience);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      logError("Error loading school announcements", error, {
        schoolId: auth.schoolId,
      });
      return jsonError("Failed to load announcements", 500);
    }

    return jsonOk({ announcements: data ?? [], page, limit, hasMore: (data?.length ?? 0) === limit });
  } catch (error) {
    logError("Unexpected error in school announcements GET", error);
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
      body: createAnnouncementBodySchema,
    });
    if (!validated.ok) return validated.response;
    const body = validated.body!;

    const { data, error } = await supabaseServerClient
      .from("school_announcements")
      .insert({
        school_id: auth.schoolId,
        title: body.title,
        content: body.content,
        audience: body.audience,
        status: body.status,
        scheduled_at: body.scheduled_at ?? null,
      })
      .select("id, title, content, audience, status, scheduled_at, created_at, updated_at")
      .single();

    if (error || !data) {
      logError("Error creating announcement", error, {
        schoolId: auth.schoolId,
      });
      return jsonError("Failed to create announcement", 500);
    }

    await writeSchoolAuditLog({
      schoolId: auth.schoolId,
      actorUserId: auth.user.id,
      action: "published",
      entityType: "announcement",
      entityId: data.id,
      metadata: { title: data.title, audience: data.audience },
    });

    return jsonOk({ announcement: data });
  } catch (error) {
    logError("Unexpected error in school announcements POST", error);
    return jsonError("Internal server error", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const rateLimitError = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitError) return rateLimitError;

    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;
    if (!canManageAnnouncements(auth.role)) return forbiddenSchoolAction("Only admins and staff can delete announcements");

    const validated = await validateRequest(request, {
      query: deleteAnnouncementQuerySchema,
    });
    if (!validated.ok) return validated.response;
    const { id: announcementId } = validated.query!;

    const { error } = await supabaseServerClient
      .from("school_announcements")
      .delete()
      .eq("id", announcementId)
      .eq("school_id", auth.schoolId);

    if (error) {
      logError("Error deleting announcement", error, { schoolId: auth.schoolId });
      return jsonError("Failed to delete announcement", 500);
    }

    await writeSchoolAuditLog({
      schoolId: auth.schoolId,
      actorUserId: auth.user.id,
      action: "deleted",
      entityType: "announcement",
      entityId: announcementId,
      metadata: {},
    });

    return jsonOk({ ok: true });
  } catch (error) {
    logError("Unexpected error in school announcements DELETE", error);
    return jsonError("Internal server error", 500);
  }
}
