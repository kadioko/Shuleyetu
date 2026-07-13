import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";
import { validateRequest, reviewBodySchema } from "@/lib/validation";
import { withRateLimit, rateLimitConfigs } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitResponse) return rateLimitResponse;

    // Validate input first (fail fast regardless of auth)
    const validation = await validateRequest(request, { body: reviewBodySchema });
    if (!validation.ok) return validation.response;

    const { vendor_id: vendorId, rating, comment: rawComment } = validation.body;

    // Get the auth token from the request
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonError("Authentication required to submit a review", 401);
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabaseServerClient.auth.getUser(token);
    if (authError || !user) {
      return jsonError("Invalid authentication", 401);
    }
    const trimmedComment = rawComment?.trim() ?? "";

    // Verify vendor exists
    const { data: vendor } = await supabaseServerClient
      .from("vendors")
      .select("id")
      .eq("id", vendorId)
      .single();

    if (!vendor) return jsonError("Vendor not found", 404);

    // Derive reviewer display name from user metadata or email
    const reviewerEmail = user.email;
    if (!reviewerEmail) {
      return jsonError("User email is required to submit a review", 400);
    }

    const reviewerName =
      (user.user_metadata?.name as string | undefined)?.trim() ||
      (user.user_metadata?.full_name as string | undefined)?.trim() ||
      reviewerEmail;

    // Check if user already reviewed this vendor by email
    const { data: existingReview } = await supabaseServerClient
      .from("vendor_reviews")
      .select("id")
      .eq("vendor_id", vendorId)
      .eq("reviewer_email", reviewerEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existingReview) {
      // Update existing review and reset approval to pending
      const { error: updateError } = await supabaseServerClient
        .from("vendor_reviews")
        .update({ rating, comment: trimmedComment, reviewer_name: reviewerName, is_approved: false, updated_at: new Date().toISOString() })
        .eq("id", existingReview.id);

      if (updateError) {
        logError("Error updating vendor review", updateError);
        return jsonError("Failed to update review", 500);
      }
      return jsonOk({ message: "Review updated and pending approval" });
    }

    // Insert new review
    const { error: insertError } = await supabaseServerClient
      .from("vendor_reviews")
      .insert({
        vendor_id: vendorId,
        reviewer_email: reviewerEmail,
        reviewer_name: reviewerName,
        rating,
        comment: trimmedComment,
        is_approved: false,
      });

    if (insertError) {
      logError("Error creating vendor review", insertError);
      return jsonError("Failed to submit review", 500);
    }

    return jsonOk({ message: "Review submitted and pending approval" });
  } catch (error) {
    logError("Unexpected error in vendor reviews POST", error);
    return jsonError("Internal server error", 500);
  }
}
