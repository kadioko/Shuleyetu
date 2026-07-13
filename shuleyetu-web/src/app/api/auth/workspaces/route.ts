import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { parseBearerToken } from "@/lib/httpAuth";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";
import { validateRequest, paginationSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VendorWorkspaceRow = {
  vendor_id: string;
  vendors: { name: string | null } | { name: string | null }[] | null;
};

type SchoolWorkspaceRow = {
  school_id: string;
  role: string;
  schools: { name: string | null } | { name: string | null }[] | null;
};

export async function GET(request: NextRequest) {
  // Rate-limit: auth-tier (10 req / 15 min per IP)
  const rateLimitResponse = await withRateLimit(request, rateLimitConfigs.auth);
  if (rateLimitResponse) return rateLimitResponse;

  // Validate optional pagination query params (page/limit coerced from strings)
  const validation = await validateRequest(request, { query: paginationSchema });
  if (!validation.ok) return validation.response;

  try {
    const token = parseBearerToken(request.headers.get("authorization"));
    if (!token) return jsonError("Unauthorized", 401);

    const { data: userData, error: userError } =
      await supabaseServerClient.auth.getUser(token);
    const user = userData?.user ?? null;
    if (userError || !user) return jsonError("Unauthorized", 401);

    const [vendorResult, schoolResult, adminResult] = await Promise.all([
      supabaseServerClient
        .from("vendor_users")
        .select("vendor_id, vendors(name)")
        .eq("user_id", user.id),
      supabaseServerClient
        .from("school_users")
        .select("school_id, role, schools(name)")
        .eq("user_id", user.id),
      supabaseServerClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id),
    ]);

    if (vendorResult.error) {
      logError("Error loading user vendor workspaces", vendorResult.error, {
        userId: user.id,
      });
      return jsonError("Failed to load vendor access", 500);
    }

    if (schoolResult.error) {
      logError("Error loading user school workspaces", schoolResult.error, {
        userId: user.id,
      });
      return jsonError("Failed to load school access", 500);
    }

    if (adminResult.error) {
      logError("Error loading user roles", adminResult.error, {
        userId: user.id,
      });
      return jsonError("Failed to load account roles", 500);
    }

    const vendorRows = (vendorResult.data ?? []) as VendorWorkspaceRow[];
    const schoolRows = (schoolResult.data ?? []) as SchoolWorkspaceRow[];

    const vendors = vendorRows.map((row) => ({
      id: row.vendor_id,
      name: Array.isArray(row.vendors)
        ? row.vendors[0]?.name ?? "Vendor store"
        : row.vendors?.name ?? "Vendor store",
    }));

    const schools = schoolRows.map((row) => ({
      id: row.school_id,
      name: Array.isArray(row.schools)
        ? row.schools[0]?.name ?? "School"
        : row.schools?.name ?? "School",
      role: row.role,
    }));

    const roles = (adminResult.data ?? []).map((row) => row.role);

    return jsonOk({
      user: { id: user.id, email: user.email ?? null },
      vendors,
      schools,
      roles,
      hasVendor: vendors.length > 0,
      hasSchool: schools.length > 0,
      isAdmin: roles.includes("admin"),
    });
  } catch (error) {
    logError("Unexpected error loading workspaces", error);
    return jsonError("Internal server error", 500);
  }
}
