import { NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabaseServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();

  try {
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey || !/^https?:\/\//i.test(supabaseUrl)) {
      const responseTime = Date.now() - startTime;
      return NextResponse.json(
        {
          status: 'unhealthy',
          error: 'Supabase environment variables are not configured correctly.',
          timestamp: new Date().toISOString(),
          responseTime: `${responseTime}ms`,
          checks: {
            database: 'error',
            api: 'ok',
          },
        },
        { status: 503 }
      );
    }

    // Check database connectivity
    const { data, error } = await supabaseServerClient
      .from('vendors')
      .select('id')
      .limit(1);

    if (error) throw error;

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        responseTime: `${responseTime}ms`,
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV,
        checks: {
          database: 'ok',
          api: 'ok',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        checks: {
          database: 'error',
          api: 'ok',
        },
      },
      { status: 503 }
    );
  }
}
