import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { parseBearerToken } from "@/lib/httpAuth";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = parseBearerToken(request.headers.get("authorization"));
    if (!token) {
      return jsonOk({ isAuthenticated: false, isAdmin: false }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabaseServerClient.auth.getUser(
      token,
    );

    const user = userData?.user ?? null;

    if (userError || !user) {
      return jsonOk({ isAuthenticated: false, isAdmin: false }, { status: 401 });
    }

    const { data: roleRow, error: roleError } = await supabaseServerClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) {
      logError("Error checking admin role", roleError, { userId: user.id });
      return jsonOk({ isAuthenticated: true, isAdmin: false }, { status: 500 });
    }

    return jsonOk({
      isAuthenticated: true,
      isAdmin: Boolean(roleRow?.role === "admin"),
      user: { id: user.id, email: user.email ?? null },
    });
  } catch (error) {
    logError("Unexpected error in admin check", error);
    return jsonError("Internal server error", 500);
  }
}
