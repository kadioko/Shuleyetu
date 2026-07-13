import { NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { requireSchoolUser, writeSchoolAuditLog } from "@/lib/schoolAuth";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { validateRequest, emailSchema, uuidSchema } from "@/lib/validation";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validRoles = ["admin", "teacher", "staff"] as const;
type SchoolUserRole = (typeof validRoles)[number];

const schoolUserRoleSchema = z.enum(["admin", "teacher", "staff"]);

function normalizeRole(role: string | undefined): SchoolUserRole {
  return validRoles.includes(role as SchoolUserRole)
    ? (role as SchoolUserRole)
    : "staff";
}

async function requireSchoolAdmin(request: NextRequest) {
  const auth = await requireSchoolUser(request);
  if (!auth.ok) return auth;
  if (auth.role !== "admin") {
    return {
      ok: false as const,
      response: jsonError("Only school admins can manage user access", 403),
    };
  }
  return auth;
}

export async function GET(request: NextRequest) {
  try {
    const rateLimitError = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitError) return rateLimitError;

    const auth = await requireSchoolAdmin(request);
    if (!auth.ok) return auth.response;

    const { data: users, error } = await supabaseServerClient
      .from("school_users")
      .select("id, user_id, role, created_at")
      .eq("school_id", auth.schoolId)
      .order("created_at", { ascending: true });

    if (error) {
      logError("Error loading school users", error, { schoolId: auth.schoolId });
      return jsonError("Failed to load school users", 500);
    }

    const userIds = (users ?? []).map((user) => user.user_id);
    const { data: emails, error: emailError } = await supabaseServerClient.rpc(
      "get_user_emails_by_ids",
      { p_user_ids: userIds },
    );

    if (emailError) {
      logError("Error loading school user emails", emailError, {
        schoolId: auth.schoolId,
      });
    }

    const emailMap = new Map<string, string | null>();
    ((emails ?? []) as Array<{ id: string; email: string | null }>).forEach((row) => {
      emailMap.set(row.id, row.email);
    });

    return jsonOk({
      users: (users ?? []).map((user) => ({
        ...user,
        email: emailMap.get(user.user_id) ?? null,
      })),
    });
  } catch (error) {
    logError("Unexpected error in school users GET", error);
    return jsonError("Internal server error", 500);
  }
}

const inviteUserBodySchema = z.object({
  email: emailSchema,
  role: schoolUserRoleSchema.default("staff"),
});

const updateUserRoleBodySchema = z.object({
  userId: uuidSchema,
  role: schoolUserRoleSchema,
});

const removeUserQuerySchema = z.object({
  userId: uuidSchema,
});

export async function POST(request: NextRequest) {
  try {
    const rateLimitError = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitError) return rateLimitError;

    const auth = await requireSchoolAdmin(request);
    if (!auth.ok) return auth.response;

    const validated = await validateRequest(request, {
      body: inviteUserBodySchema,
    });
    if (!validated.ok) return validated.response;
    const body = validated.body!;

    const email = body.email.trim().toLowerCase();
    const role = body.role;
    const { data: userId, error: userLookupError } = await supabaseServerClient.rpc(
      "get_user_id_by_email",
      { p_email: email },
    );

    if (userLookupError) {
      logError("Error looking up school user by email", userLookupError, { email });
      return jsonError("Failed to look up user", 500);
    }

    if (!userId) {
      const { data: invite, error: inviteError } = await supabaseServerClient
        .from("school_invites")
        .upsert(
          {
            school_id: auth.schoolId,
            email,
            role,
            status: "pending",
            invited_by: auth.user.id,
          },
          { onConflict: "school_id,email" },
        )
        .select("id, email, role, token, status, created_at")
        .single();

      if (inviteError || !invite) {
        logError("Error creating school invite", inviteError, {
          schoolId: auth.schoolId,
          email,
        });
        return jsonError("Failed to create invite", 500);
      }

      await writeSchoolAuditLog({
        schoolId: auth.schoolId,
        actorUserId: auth.user.id,
        action: "invited",
        entityType: "school_invite",
        entityId: invite.id,
        metadata: { email, role },
      });

      return jsonOk({ invite });
    }

    const { data, error } = await supabaseServerClient
      .from("school_users")
      .upsert(
        {
          user_id: userId,
          school_id: auth.schoolId,
          role,
        },
        { onConflict: "user_id,school_id" },
      )
      .select("id, user_id, role, created_at")
      .single();

    if (error || !data) {
      logError("Error linking school user", error, {
        schoolId: auth.schoolId,
        userId,
      });
      return jsonError("Failed to link school user", 500);
    }

    await writeSchoolAuditLog({
      schoolId: auth.schoolId,
      actorUserId: auth.user.id,
      action: "linked",
      entityType: "school_user",
      entityId: data.id,
      metadata: { user_id: userId, email, role },
    });

    return jsonOk({ user: { ...data, email } });
  } catch (error) {
    logError("Unexpected error in school users POST", error);
    return jsonError("Internal server error", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const rateLimitError = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitError) return rateLimitError;

    const auth = await requireSchoolAdmin(request);
    if (!auth.ok) return auth.response;

    const validated = await validateRequest(request, {
      body: updateUserRoleBodySchema,
    });
    if (!validated.ok) return validated.response;
    const body = validated.body!;

    const role = body.role;
    const { error } = await supabaseServerClient
      .from("school_users")
      .update({ role })
      .eq("school_id", auth.schoolId)
      .eq("user_id", body.userId);

    if (error) {
      logError("Error updating school user role", error, {
        schoolId: auth.schoolId,
        userId: body.userId,
      });
      return jsonError("Failed to update user role", 500);
    }

    await writeSchoolAuditLog({
      schoolId: auth.schoolId,
      actorUserId: auth.user.id,
      action: "role_updated",
      entityType: "school_user",
      entityId: null,
      metadata: { user_id: body.userId, role },
    });

    return jsonOk({ ok: true });
  } catch (error) {
    logError("Unexpected error in school users PATCH", error);
    return jsonError("Internal server error", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const rateLimitError = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitError) return rateLimitError;

    const auth = await requireSchoolAdmin(request);
    if (!auth.ok) return auth.response;

    const validated = await validateRequest(request, {
      query: removeUserQuerySchema,
    });
    if (!validated.ok) return validated.response;
    const { userId } = validated.query!;

    if (userId === auth.user.id) {
      return jsonError("You cannot remove your own school access.", 400);
    }

    const { error } = await supabaseServerClient
      .from("school_users")
      .delete()
      .eq("school_id", auth.schoolId)
      .eq("user_id", userId);

    if (error) {
      logError("Error removing school user", error, {
        schoolId: auth.schoolId,
        userId,
      });
      return jsonError("Failed to remove user", 500);
    }

    await writeSchoolAuditLog({
      schoolId: auth.schoolId,
      actorUserId: auth.user.id,
      action: "removed",
      entityType: "school_user",
      entityId: null,
      metadata: { user_id: userId },
    });

    return jsonOk({ ok: true });
  } catch (error) {
    logError("Unexpected error in school users DELETE", error);
    return jsonError("Internal server error", 500);
  }
}
