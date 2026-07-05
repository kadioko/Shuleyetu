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

    // Prevent a user from creating multiple schools
    const { data: existingSchoolUser } = await supabaseServerClient
      .from("school_users")
      .select("school_id")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (existingSchoolUser) {
      return jsonError(
        "You already belong to a school. Only one school can be created per account.",
        409,
      );
    }

    const { data: similarSchool, error: similarError } = await supabaseServerClient
      .from("schools")
      .select("id, name, region, district")
      .ilike("name", name)
      .limit(1)
      .maybeSingle();

    if (similarError) {
      logError("Error checking duplicate school", similarError, { name });
      return jsonError("Failed to check school name", 500);
    }

    if (similarSchool) {
      return jsonError(
        `A school named "${similarSchool.name}" already exists. Ask that school admin to invite/link your account, or contact Shuleyetu support if this is a different school.`,
        409,
      );
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
