import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { canManageSchoolSettings, forbiddenSchoolAction, requireSchoolUser, writeSchoolAuditLog } from "@/lib/schoolAuth";
import { jsonError, jsonOk, readJsonBody } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;

    const { data: school, error: schoolError } = await supabaseServerClient
      .from("schools")
      .select(
        "id, name, region, district, ward, phone, email, address, is_active, created_at, updated_at",
      )
      .eq("id", auth.schoolId)
      .single();

    if (schoolError || !school) {
      logError("Error loading school settings", schoolError, {
        userId: auth.user.id,
        schoolId: auth.schoolId,
      });
      return jsonError("Failed to load school settings", 500);
    }

    return jsonOk({ school });
  } catch (error) {
    logError("Unexpected error in school settings GET", error);
    return jsonError("Internal server error", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;
    if (!canManageSchoolSettings(auth.role)) return forbiddenSchoolAction("Only school admins can update settings");

    const body = await readJsonBody<{
      name?: string;
      region?: string;
      district?: string;
      ward?: string;
      phone?: string;
      email?: string;
      address?: string;
      is_active?: boolean;
    }>(request);

    const updates: Record<string, unknown> = {};
    const stringFields = ["name", "region", "district", "ward", "phone", "email", "address"];
    for (const field of stringFields) {
      if (body?.[field as keyof typeof body] !== undefined) {
        updates[field] = String(body[field as keyof typeof body] ?? "").trim() || null;
      }
    }
    if (body?.is_active !== undefined) {
      updates.is_active = Boolean(body.is_active);
    }

    if (Object.keys(updates).length === 0) {
      return jsonError("No fields provided to update", 400);
    }

    const { data: school, error: updateError } = await supabaseServerClient
      .from("schools")
      .update(updates)
      .eq("id", auth.schoolId)
      .select(
        "id, name, region, district, ward, phone, email, address, is_active, created_at, updated_at",
      )
      .single();

    if (updateError || !school) {
      logError("Error updating school settings", updateError, {
        userId: auth.user.id,
        schoolId: auth.schoolId,
      });
      return jsonError("Failed to update school settings", 500);
    }

    await writeSchoolAuditLog({
      schoolId: auth.schoolId,
      actorUserId: auth.user.id,
      action: "updated",
      entityType: "settings",
      entityId: auth.schoolId,
      metadata: { fields: Object.keys(updates) },
    });

    return jsonOk({ school });
  } catch (error) {
    logError("Unexpected error in school settings PATCH", error);
    return jsonError("Internal server error", 500);
  }
}
