-- Shuleyetu school management portal schema

-- Schools
--
-- Core record for a school that uses the Shuleyetu management portal.
-- A school can have multiple linked users via school_users.
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text,
  district text,
  ward text,
  phone text,
  email text,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Users linked to a school with a role.
-- A user can belong to multiple schools, but a single school_id is the primary
-- workspace for the portal.
create table public.school_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'staff', 'teacher')),
  created_at timestamptz not null default now(),
  unique (user_id, school_id)
);

-- Classes / streams within a school
create table public.school_classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  grade text,
  stream text,
  room text,
  capacity integer,
  created_at timestamptz not null default now()
);

-- Staff members (teachers, administrators, support)
create table public.school_staff (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  employee_id text,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  role text not null default 'teacher' check (role in ('admin', 'teacher', 'support')),
  subject text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

-- Students enrolled in a school
create table public.school_students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  admission_number text not null,
  first_name text not null,
  last_name text not null,
  gender text check (gender in ('male', 'female', 'other')),
  date_of_birth date,
  class_id uuid references public.school_classes(id) on delete set null,
  parent_name text,
  parent_phone text,
  parent_email text,
  address text,
  status text not null default 'active' check (status in ('active', 'inactive', 'transferred')),
  enrollment_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (school_id, admission_number)
);

-- Daily attendance records
create table public.school_attendance (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.school_students(id) on delete cascade,
  class_id uuid references public.school_classes(id) on delete set null,
  attendance_date date not null default current_date,
  status text not null check (status in ('present', 'absent', 'late', 'excused')),
  notes text,
  created_at timestamptz not null default now(),
  unique (student_id, attendance_date)
);

-- Fees / invoices assigned to a student
create table public.school_fees (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.school_students(id) on delete cascade,
  description text not null,
  amount_tzs numeric(12,2) not null,
  due_date date,
  status text not null default 'pending' check (status in ('pending', 'partial', 'paid', 'waived')),
  created_at timestamptz not null default now()
);

-- Fee payments recorded against a fee invoice
create table public.school_fee_payments (
  id uuid primary key default gen_random_uuid(),
  fee_id uuid not null references public.school_fees(id) on delete cascade,
  amount_tzs numeric(12,2) not null,
  payment_method text not null default 'cash' check (payment_method in ('cash', 'bank', 'mobile_money')),
  reference text,
  created_at timestamptz not null default now()
);

-- Announcements published by a school
create table public.school_announcements (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  content text not null,
  audience text not null default 'all' check (audience in ('all', 'parents', 'staff', 'students')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes

create index school_users_user_id_idx on public.school_users(user_id);
create index school_users_school_id_idx on public.school_users(school_id);

create index school_classes_school_id_idx on public.school_classes(school_id);

create index school_staff_school_id_idx on public.school_staff(school_id);

create index school_students_school_id_idx on public.school_students(school_id);
create index school_students_class_id_idx on public.school_students(class_id);

create index school_attendance_school_id_idx on public.school_attendance(school_id);
create index school_attendance_date_idx on public.school_attendance(attendance_date);

create index school_fees_school_id_idx on public.school_fees(school_id);
create index school_fees_student_id_idx on public.school_fees(student_id);

create index school_announcements_school_id_idx on public.school_announcements(school_id);

-- Row-level security

alter table public.schools enable row level security;
alter table public.school_users enable row level security;
alter table public.school_classes enable row level security;
alter table public.school_staff enable row level security;
alter table public.school_students enable row level security;
alter table public.school_attendance enable row level security;
alter table public.school_fees enable row level security;
alter table public.school_fee_payments enable row level security;
alter table public.school_announcements enable row level security;

-- Helper to check whether the current auth user belongs to a school.
-- This is used across the RLS policies below.
create or replace function public.is_school_user(p_school_id uuid)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1
    from public.school_users
    where user_id = auth.uid() and school_id = p_school_id
  );
$$;

-- Select policies for school users.
-- All writes are routed through the API, which uses the service role key.

create policy "schools_select_for_school_users"
  on public.schools
  for select
  using (public.is_school_user(id));

create policy "school_users_select_for_school_users"
  on public.school_users
  for select
  using (user_id = auth.uid() or public.is_school_user(school_id));

create policy "school_classes_select_for_school_users"
  on public.school_classes
  for select
  using (public.is_school_user(school_id));

create policy "school_staff_select_for_school_users"
  on public.school_staff
  for select
  using (public.is_school_user(school_id));

create policy "school_students_select_for_school_users"
  on public.school_students
  for select
  using (public.is_school_user(school_id));

create policy "school_attendance_select_for_school_users"
  on public.school_attendance
  for select
  using (public.is_school_user(school_id));

create policy "school_fees_select_for_school_users"
  on public.school_fees
  for select
  using (public.is_school_user(school_id));

create policy "school_fee_payments_select_for_school_users"
  on public.school_fee_payments
  for select
  using (fee_id in (
    select id from public.school_fees where public.is_school_user(school_id)
  ));

create policy "school_announcements_select_for_school_users"
  on public.school_announcements
  for select
  using (public.is_school_user(school_id));
