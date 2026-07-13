import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/adminAuth";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rateLimitError = await withRateLimit(request, rateLimitConfigs.admin);
  if (rateLimitError) return rateLimitError;

  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { data: roles, error } = await supabaseServerClient
      .from("user_roles")
      .select("user_id, role")
      .eq("role", "admin")
      .order("created_at", { ascending: false });

    if (error) {
      logError("Error loading admins", error, { adminUserId: auth.user.id });
      return jsonError("Failed to load admins", 500);
    }

    const typedRoles = (roles ?? []) as Array<{ user_id: string; role: string }>;
    const userIds = Array.from(new Set(typedRoles.map((r) => r.user_id))) as string[];

    const emailMap = new Map<string, string | null>();
    if (userIds.length > 0) {
      const { data: emails, error: emailsErr } = await supabaseServerClient.rpc(
        "get_user_emails_by_ids",
        { p_user_ids: userIds },
      );

      if (emailsErr) {
        logError("Error loading admin emails", emailsErr, { adminUserId: auth.user.id });
        return jsonError("Failed to load admin emails", 500);
      }

      for (const row of (emails ?? []) as any[]) {
        emailMap.set(row.user_id, row.email ?? null);
      }
    }

    const admins = typedRoles.map((r) => ({
      user_id: r.user_id,
      email: emailMap.get(r.user_id) ?? null,
    }));

    return jsonOk({ admins, currentUserId: auth.user.id });
  } catch (err) {
    logError("Unexpected error in admins", err);
    return jsonError("Internal server error", 500);
  }
}
