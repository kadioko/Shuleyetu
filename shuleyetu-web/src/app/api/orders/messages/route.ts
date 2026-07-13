import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabaseServer';
import { withRateLimit, rateLimitConfigs } from '@/lib/rateLimit';
import { validateRequest, uuidSchema } from '@/lib/validation';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const postBodySchema = z.object({
  orderId: uuidSchema,
  token: z.string().min(1, 'Token is required'),
  senderName: z.string().min(1, 'Sender name is required').max(100),
  senderRole: z.enum(['customer', 'vendor']),
  content: z.string().min(1, 'Content is required').max(2000, 'Message too long (max 2000 characters)'),
});

export async function POST(request: NextRequest) {
  // Rate-limit: general-tier (100 req / 15 min per IP)
  const rateLimitResponse = await withRateLimit(request, rateLimitConfigs.general);
  if (rateLimitResponse) return rateLimitResponse;

  // Validate and parse request body
  const validation = await validateRequest(request, { body: postBodySchema });
  if (!validation.ok) return validation.response;

  const { orderId, token, senderName, senderRole, content } = validation.body!;

  try {
    // Verify the caller has the correct access token for this order
    const { data: order, error: orderError } = await supabaseServerClient
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .eq('public_access_token', token)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found or invalid token' },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseServerClient
      .from('order_messages')
      .insert({
        order_id: orderId,
        sender_name: senderName.trim(),
        sender_role: senderRole,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting message', error);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: data }, { status: 201 });
  } catch (err) {
    console.error('Unexpected error sending message', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
