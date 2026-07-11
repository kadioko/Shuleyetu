import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { jsonError, jsonOk, readJsonBody } from "@/lib/apiUtils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await readJsonBody<{ email?: string; source?: string }>(request);
  const email = body?.email?.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError("Valid email is required", 400);
  }

  const { error } = await supabaseServerClient
    .from("newsletter_subscribers")
    .upsert(
      { email, source: body?.source ?? "footer", subscribed_at: new Date().toISOString(), unsubscribed_at: null },
      { onConflict: "email" },
    );

  if (error) {
    return jsonError("Failed to subscribe", 500);
  }

  return jsonOk({ subscribed: true });
}
