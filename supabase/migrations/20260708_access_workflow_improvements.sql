-- Access workflow improvements for vendor approvals and school auditing.

alter table public.vendors
  add column if not exists approval_status text not null default 'approved'
  check (approval_status in ('pending', 'approved', 'rejected'));

update public.vendors
set approval_status = 'approved'
where approval_status is null;

alter table public.vendors
  alter column approval_status set default 'pending';

create index if not exists vendors_approval_status_idx
  on public.vendors(approval_status);

create table if not exists public.school_audit_logs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists school_audit_logs_school_id_idx
  on public.school_audit_logs(school_id);

create index if not exists school_audit_logs_created_at_idx
  on public.school_audit_logs(created_at desc);

alter table public.school_audit_logs enable row level security;

drop policy if exists "school_audit_logs_select_for_school_users"
  on public.school_audit_logs;

create policy "school_audit_logs_select_for_school_users"
  on public.school_audit_logs
  for select
  using (public.is_school_user(school_id));

create table if not exists public.school_invites (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  email text not null,
  role text not null default 'staff'
    check (role in ('admin', 'teacher', 'staff')),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (school_id, email)
);

create index if not exists school_invites_school_id_idx
  on public.school_invites(school_id);

create index if not exists school_invites_token_idx
  on public.school_invites(token);

alter table public.school_invites enable row level security;

drop policy if exists "school_invites_select_for_school_users"
  on public.school_invites;

create policy "school_invites_select_for_school_users"
  on public.school_invites
  for select
  using (public.is_school_user(school_id));
