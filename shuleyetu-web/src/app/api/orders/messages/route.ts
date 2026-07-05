import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabaseServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, token, senderName, senderRole, content } = body;

    if (!orderId || !token || !senderName || !senderRole || !content?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['customer', 'vendor'].includes(senderRole)) {
      return NextResponse.json(
        { error: 'Invalid sender role' },
        { status: 400 }
      );
    }

    if (content.trim().length > 2000) {
      return NextResponse.json(
        { error: 'Message too long (max 2000 characters)' },
        { status: 400 }
      );
    }

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
