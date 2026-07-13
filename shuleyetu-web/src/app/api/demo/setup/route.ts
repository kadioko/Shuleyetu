import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withRateLimit, rateLimitConfigs } from '@/lib/rateLimit';
import { logError } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEMO_EMAIL = 'demo@shuleyetu.test';
const DEMO_PASSWORD = 'demo123';

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase URL or service role key');
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  // Rate-limit: one call per IP per minute to prevent abuse
  const rateLimitResponse = await withRateLimit(request, {
    ...rateLimitConfigs.general,
    windowMs: 60_000,
    maxRequests: 5,
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabase = getServiceRoleClient();

    // 1. Ensure demo school exists
    const { data: existingSchools } = await supabase
      .from('schools')
      .select('id')
      .eq('email', DEMO_EMAIL)
      .limit(1);

    let schoolId: string | null = existingSchools?.[0]?.id ?? null;
    if (!schoolId) {
      const { data: newSchool, error: schoolError } = await supabase
        .from('schools')
        .insert({
          name: 'Demo Secondary School',
          region: 'Dar es Salaam',
          district: 'Ilala',
          ward: 'Upanga',
          address: '123 Education Street',
          phone: '+255 700 111 222',
          email: DEMO_EMAIL,
          is_active: true,
        })
        .select('id')
        .single();

      if (schoolError || !newSchool) {
        logError('Failed to create demo school', schoolError);
        return NextResponse.json({ error: 'Failed to create demo school' }, { status: 500 });
      }
      schoolId = newSchool.id;

      const { data: classes } = await supabase
        .from('school_classes')
        .insert([
          { school_id: schoolId, name: 'Form 1A', grade: 'Form 1', stream: 'A', room: 'Room 101', capacity: 40 },
          { school_id: schoolId, name: 'Form 2A', grade: 'Form 2', stream: 'A', room: 'Room 201', capacity: 40 },
          { school_id: schoolId, name: 'Form 3A', grade: 'Form 3', stream: 'A', room: 'Room 301', capacity: 40 },
        ])
        .select('id');

      const classIds = classes?.map((c) => c.id) ?? [];
      if (classIds.length >= 2) {
        await supabase.from('school_students').insert([
          { school_id: schoolId, admission_number: 'DSS-001', first_name: 'Juma', last_name: 'Mwalimu', gender: 'male', class_id: classIds[0], parent_name: 'Asha Juma', parent_phone: '+255 711 222 333', parent_email: 'asha@example.com', address: 'Dar es Salaam', status: 'active' },
          { school_id: schoolId, admission_number: 'DSS-002', first_name: 'Grace', last_name: 'Mushi', gender: 'female', class_id: classIds[0], parent_name: 'Peter Mushi', parent_phone: '+255 722 333 444', parent_email: 'peter@example.com', address: 'Dar es Salaam', status: 'active' },
          { school_id: schoolId, admission_number: 'DSS-003', first_name: 'Baraka', last_name: 'Omondi', gender: 'male', class_id: classIds[1], parent_name: 'Faith Omondi', parent_phone: '+255 733 444 555', parent_email: 'faith@example.com', address: 'Dar es Salaam', status: 'active' },
        ]);
      }

      await supabase.from('school_staff').insert({
        school_id: schoolId,
        employee_id: 'DSS-STAFF-001',
        first_name: 'Anna',
        last_name: 'Kibona',
        role: 'admin',
        phone: '+255 744 555 666',
        email: 'anna@shuleyetu.test',
        status: 'active',
      });
    }

    // 2. Ensure demo user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const demoUser = existingUsers?.users.find((u) => u.email === DEMO_EMAIL);
    let userId: string | null = demoUser?.id ?? null;

    if (!userId) {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
      });

      if (createError || !newUser.user) {
        logError('Failed to create demo user', createError);
        return NextResponse.json({ error: 'Failed to create demo user' }, { status: 500 });
      }
      userId = newUser.user.id;
    }

    // 3. Ensure demo user is linked to demo school
    const { data: existingLinks } = await supabase
      .from('school_users')
      .select('id')
      .eq('user_id', userId)
      .eq('school_id', schoolId)
      .limit(1);

    if (!existingLinks?.length) {
      const { error: linkError } = await supabase
        .from('school_users')
        .insert({ user_id: userId, school_id: schoolId, role: 'admin' });

      if (linkError) {
        logError('Failed to link demo user to school', linkError);
        return NextResponse.json({ error: 'Failed to link demo user to school' }, { status: 500 });
      }
    }

    return NextResponse.json({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      schoolId,
    });
  } catch (error) {
    logError('Unexpected error in demo setup', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
