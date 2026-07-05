import { NextRequest, NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { parseBearerToken } from "@/lib/httpAuth";

export type SchoolAuthSuccess = {
  ok: true;
  user: { id: string; email: string | null };
  schoolId: string;
  role: string;
};

export type SchoolAuthFailure = {
  ok: false;
  response: NextResponse;
};

export type SchoolAuthResult = SchoolAuthSuccess | SchoolAuthFailure;

export async function requireSchoolUser(
  request: NextRequest,
): Promise<SchoolAuthResult> {
  const token = parseBearerToken(request.headers.get("authorization"));
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  const { data: userData, error: userError } =
    await supabaseServerClient.auth.getUser(token);

  const user = userData?.user ?? null;
  if (userError || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  const { data: schoolUser, error: schoolUserError } = await supabaseServerClient
    .from("school_users")
    .select("school_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (schoolUserError) {
    console.error("Error checking school user", schoolUserError);
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Failed to verify school access" },
        { status: 500 },
      ),
    };
  }

  if (!schoolUser) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No school linked to this account" },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    user: { id: user.id, email: user.email ?? null },
    schoolId: schoolUser.school_id,
    role: schoolUser.role,
  };
}

export async function requireAuthenticatedUser(
  request: NextRequest,
): Promise<
  | { ok: true; user: { id: string; email: string | null } }
  | { ok: false; response: NextResponse }
> {
  const token = parseBearerToken(request.headers.get("authorization"));
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  const { data: userData, error: userError } =
    await supabaseServerClient.auth.getUser(token);

  const user = userData?.user ?? null;
  if (userError || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  return {
    ok: true,
    user: { id: user.id, email: user.email ?? null },
  };
}
