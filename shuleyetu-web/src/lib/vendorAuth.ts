import { NextRequest, NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { parseBearerToken } from "@/lib/httpAuth";

export type VendorAuthSuccess = {
  ok: true;
  user: { id: string; email: string | null };
  vendorId: string;
  vendor: {
    id: string;
    name: string | null;
    approval_status: "pending" | "approved" | "rejected";
  };
};

export type VendorAuthFailure = {
  ok: false;
  response: NextResponse;
};

export type VendorAuthResult = VendorAuthSuccess | VendorAuthFailure;

export async function requireVendorUser(
  request: NextRequest,
  options: { requireApproved?: boolean } = {},
): Promise<VendorAuthResult> {
  const token = parseBearerToken(request.headers.get("authorization"));
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: userData, error: userError } =
    await supabaseServerClient.auth.getUser(token);
  const user = userData?.user ?? null;
  if (userError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: mapping, error: mappingError } = await supabaseServerClient
    .from("vendor_users")
    .select("vendor_id, vendors(id, name, approval_status)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (mappingError) {
    console.error("Error checking vendor user", mappingError);
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Failed to verify vendor access" },
        { status: 500 },
      ),
    };
  }

  if (!mapping) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No vendor linked to this account" },
        { status: 403 },
      ),
    };
  }

  const vendorJoin = Array.isArray(mapping.vendors)
    ? mapping.vendors[0]
    : mapping.vendors;
  const vendor = {
    id: vendorJoin?.id ?? mapping.vendor_id,
    name: vendorJoin?.name ?? null,
    approval_status:
      (vendorJoin?.approval_status as "pending" | "approved" | "rejected" | undefined) ??
      "approved",
  };

  if (options.requireApproved && vendor.approval_status !== "approved") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Vendor approval is required before using this feature" },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    user: { id: user.id, email: user.email ?? null },
    vendorId: mapping.vendor_id,
    vendor,
  };
}
