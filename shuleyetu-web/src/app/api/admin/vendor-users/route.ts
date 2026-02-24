import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/adminAuth";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { data: links, error } = await supabaseServerClient
      .from("vendor_users")
      .select("user_id, vendor_id, created_at, vendors(name)")
      .order("created_at", { ascending: false });

    if (error) {
      logError("Error loading vendor users", error, { adminUserId: auth.user.id });
      return jsonError("Failed to load vendor users", 500);
    }

    const typedLinks = (links ?? []) as Array<{
      user_id: string;
      vendor_id: string;
      created_at: string;
      vendors?: unknown;
    }>;

    const userIds = Array.from(
      new Set(typedLinks.map((l) => l.user_id).filter(Boolean)),
    ) as string[];

    const emailMap = new Map<string, string | null>();

    if (userIds.length > 0) {
      const { data: emails, error: emailsErr } = await supabaseServerClient.rpc(
        "get_user_emails_by_ids",
        { p_user_ids: userIds },
      );

      if (emailsErr) {
        logError("Error loading user emails", emailsErr, { adminUserId: auth.user.id });
        return jsonError("Failed to load user emails", 500);
      }

      for (const row of (emails ?? []) as any[]) {
        emailMap.set(row.user_id, row.email ?? null);
      }
    }

    const rows = typedLinks.map((l) => {
      const vendorJoin = Array.isArray(l.vendors) ? (l.vendors as any[])[0] : l.vendors;
      return {
        user_id: l.user_id,
        email: emailMap.get(l.user_id) ?? null,
        vendor_id: l.vendor_id,
        vendor_name: (vendorJoin as any)?.name ?? null,
        created_at: l.created_at,
      };
    });

    return jsonOk({ vendorUsers: rows });
  } catch (err) {
    logError("Unexpected error in vendor-users", err);
    return jsonError("Internal server error", 500);
  }
}
