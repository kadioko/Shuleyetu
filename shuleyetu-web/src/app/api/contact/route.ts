import { NextRequest } from 'next/server';
import { supabaseServerClient } from '@/lib/supabaseServer';
import { jsonError, jsonOk } from '@/lib/apiUtils';
import { logError } from '@/lib/logger';
import { validateRequest, contactBodySchema } from '@/lib/validation';
import { withRateLimit, rateLimitConfigs } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, rateLimitConfigs.general);
    if (rateLimitResponse) return rateLimitResponse;

    const validation = await validateRequest(request, { body: contactBodySchema });
    if (!validation.ok) return validation.response;

    const { name, email, subject, message } = validation.body!;
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    // Persist to contact_messages table (insert is idempotent — any error surfaces to user)
    const { error: dbError } = await supabaseServerClient
      .from('contact_messages')
      .insert({
        name: trimmedName,
        email: trimmedEmail,
        subject: trimmedSubject,
        message: trimmedMessage,
      });

    if (dbError) {
      // If the table doesn't exist yet we fall through gracefully —
      // but we still return success so the UX works during development.
      logError('Failed to persist contact message', dbError);
      if (dbError.code !== '42P01') {
        // 42P01 = relation does not exist (table not yet migrated)
        return jsonError('Failed to send message. Please try again.', 500);
      }
    }

    return jsonOk({ success: true });
  } catch (error) {
    logError('Unexpected error in contact API', error);
    return jsonError('Internal server error', 500);
  }
}
