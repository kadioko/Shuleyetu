import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { requireAuthenticatedUser } from "@/lib/schoolAuth";
import { jsonError, jsonOk, readJsonBody } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedUser(request);
    if (!auth.ok) return auth.response;

    const body = await readJsonBody<{
      name?: string;
      region?: string;
      district?: string;
      ward?: string;
      phone?: string;
      email?: string;
      address?: string;
    }>(request);

    const name = body?.name?.trim();
    if (!name) {
      return jsonError("School name is required", 400);
    }

    // Create the school
    const { data: school, error: schoolError } = await supabaseServerClient
      .from("schools")
      .insert({
        name,
        region: body?.region?.trim() ?? null,
        district: body?.district?.trim() ?? null,
        ward: body?.ward?.trim() ?? null,
        phone: body?.phone?.trim() ?? null,
        email: body?.email?.trim() ?? null,
        address: body?.address?.trim() ?? null,
      })
      .select("id, name, region, district, ward, phone, email, address, created_at")
      .single();

    if (schoolError || !school) {
      logError("Error creating school", schoolError, { userId: auth.user.id });
      return jsonError("Failed to create school", 500);
    }

    // Link the creating user as the school admin
    const { error: linkError } = await supabaseServerClient
      .from("school_users")
      .insert({
        user_id: auth.user.id,
        school_id: school.id,
        role: "admin",
      });

    if (linkError) {
      logError("Error linking school user", linkError, {
        userId: auth.user.id,
        schoolId: school.id,
      });
      return jsonError("Failed to link account to school", 500);
    }

    return jsonOk({ school });
  } catch (error) {
    logError("Unexpected error in school setup", error);
    return jsonError("Internal server error", 500);
  }
}
