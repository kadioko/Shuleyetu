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

    const env = {
      NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    };

    const checks: Array<{ name: string; ok: boolean; detail: string }> = [];
    checks.push({
      name: "Supabase URL",
      ok: env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL,
      detail: env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL ? "Configured" : "Missing",
    });
    checks.push({
      name: "Service role key",
      ok: env.SUPABASE_SERVICE_ROLE_KEY,
      detail: env.SUPABASE_SERVICE_ROLE_KEY ? "Configured" : "Missing",
    });

    const { error: dbError } = await supabaseServerClient
      .from("vendors")
      .select("id", { count: "exact", head: true });

    checks.push({
      name: "Supabase connectivity",
      ok: !dbError,
      detail: dbError ? dbError.message : "Connected",
    });

    const { error: approvalColumnError } = await supabaseServerClient
      .from("vendors")
      .select("approval_status")
      .limit(1);

    checks.push({
      name: "Vendor approval migration",
      ok: !approvalColumnError,
      detail: approvalColumnError ? "approval_status missing or inaccessible" : "Available",
    });

    const { error: auditTableError } = await supabaseServerClient
      .from("school_audit_logs")
      .select("id", { count: "exact", head: true });

    checks.push({
      name: "School audit log migration",
      ok: !auditTableError,
      detail: auditTableError ? "school_audit_logs missing or inaccessible" : "Available",
    });

    return jsonOk({ checks });
  } catch (error) {
    logError("Unexpected error in admin diagnostics", error);
    return jsonError("Internal server error", 500);
  }
}
