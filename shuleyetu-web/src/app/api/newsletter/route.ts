import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { validateRequest, newsletterBodySchema } from "@/lib/validation";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const newsletterRequestSchema = newsletterBodySchema.extend({
  source: z.string().max(100).optional(),
});

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, rateLimitConfigs.general);
  if (rateLimitResponse) return rateLimitResponse;

  const validation = await validateRequest(request, { body: newsletterRequestSchema });
  if (!validation.ok) return validation.response;

  const email = validation.body.email.trim().toLowerCase();

  const { error } = await supabaseServerClient
    .from("newsletter_subscribers")
    .upsert(
      { email, source: validation.body.source ?? "footer", subscribed_at: new Date().toISOString(), unsubscribed_at: null },
      { onConflict: "email" },
    );

  if (error) {
    return jsonError("Failed to subscribe", 500);
  }

  return jsonOk({ subscribed: true });
}
