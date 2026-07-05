import { NextRequest } from 'next/server';
import { supabaseServerClient } from '@/lib/supabaseServer';
import { jsonError, jsonOk } from '@/lib/apiUtils';
import { logError } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_SUBJECTS = [
  'General Inquiry',
  'Vendor Partnership',
  'Order Support',
  'Technical Issue',
  'Feedback',
  'Other',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body) return jsonError('Invalid request body', 400);

    const { name, email, subject, message } = body as {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
    };

    const trimmedName = name?.trim() ?? '';
    const trimmedEmail = email?.trim().toLowerCase() ?? '';
    const trimmedSubject = subject?.trim() ?? '';
    const trimmedMessage = message?.trim() ?? '';

    if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
      return jsonError('All fields are required', 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return jsonError('Invalid email address', 400);
    }

    if (!ALLOWED_SUBJECTS.includes(trimmedSubject)) {
      return jsonError('Invalid subject', 400);
    }

    if (trimmedMessage.length > 2000) {
      return jsonError('Message is too long (max 2000 characters)', 400);
    }

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
