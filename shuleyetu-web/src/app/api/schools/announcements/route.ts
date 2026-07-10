import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { canManageAnnouncements, forbiddenSchoolAction, requireSchoolUser, writeSchoolAuditLog } from "@/lib/schoolAuth";
import { jsonError, jsonOk, readJsonBody } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;
    if (!canManageAnnouncements(auth.role)) return forbiddenSchoolAction("Only admins and staff can publish announcements");

    const { searchParams } = new URL(request.url);
    const audience = searchParams.get("audience");

    let query = supabaseServerClient
      .from("school_announcements")
      .select("id, title, content, audience, status, scheduled_at, created_at, updated_at")
      .eq("school_id", auth.schoolId);

    if (audience) {
      query = query.eq("audience", audience);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false });

    if (error) {
      logError("Error loading school announcements", error, {
        schoolId: auth.schoolId,
      });
      return jsonError("Failed to load announcements", 500);
    }

    return jsonOk({ announcements: data ?? [] });
  } catch (error) {
    logError("Unexpected error in school announcements GET", error);
    return jsonError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;

    const body = await readJsonBody<{
      title?: string;
      content?: string;
      audience?: string;
      status?: string;
      scheduled_at?: string | null;
    }>(request);

    const title = body?.title?.trim();
    const content = body?.content?.trim();
    const audience = body?.audience?.trim();

    if (!title || !content) {
      return jsonError("Title and content are required", 400);
    }

    const validAudience = ["all", "parents", "staff", "students"].includes(
      audience ?? "",
    )
      ? (audience as "all" | "parents" | "staff" | "students")
      : "all";

    const validStatus = ["published", "draft"].includes(body?.status ?? "")
      ? body!.status
      : "published";

    const { data, error } = await supabaseServerClient
      .from("school_announcements")
      .insert({
        school_id: auth.schoolId,
        title,
        content,
        audience: validAudience,
        status: validStatus,
        scheduled_at: body?.scheduled_at ?? null,
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
    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;
    if (!canManageAnnouncements(auth.role)) return forbiddenSchoolAction("Only admins and staff can delete announcements");

    const { searchParams } = new URL(request.url);
    const announcementId = searchParams.get("id");
    if (!announcementId) return jsonError("Announcement id is required", 400);

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
