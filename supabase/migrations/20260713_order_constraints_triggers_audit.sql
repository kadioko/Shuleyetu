-- ============================================================
-- Migration: 20260713_order_constraints_triggers_audit
-- Covers items 46, 47, 48, 49
-- ============================================================

-- ============================================================
-- 46. Order status transition enforcement
-- ============================================================

-- Enforce valid order status transitions
create or replace function public.enforce_order_status_transition()
returns trigger
language plpgsql
as $$
declare
  valid_transitions jsonb := '{
    "pending": ["confirmed", "cancelled"],
    "confirmed": ["processing", "cancelled"],
    "processing": ["shipped", "cancelled"],
    "shipped": ["delivered"],
    "delivered": [],
    "cancelled": [],
    "awaiting_payment": ["pending", "paid", "cancelled"],
    "paid": ["confirmed", "processing"]
  }'::jsonb;
  allowed jsonb;
begin
  -- Skip if status hasn't changed
  if OLD.status = NEW.status then
    return NEW;
  end if;

  allowed := valid_transitions -> OLD.status;

  if allowed is null then
    -- Unknown old status, allow transition (backwards compat)
    return NEW;
  end if;

  if not allowed ? NEW.status then
    raise exception 'Invalid status transition from "%" to "%". Allowed: %',
      OLD.status, NEW.status, allowed;
  end if;

  return NEW;
end;
$$;

drop trigger if exists tr_enforce_order_status on public.orders;
create trigger tr_enforce_order_status
  before update of status on public.orders
  for each row
  execute function public.enforce_order_status_transition();

-- ============================================================
-- 47. Payment timeout/expiry for pending orders
-- ============================================================

-- Add expiry column to orders
alter table public.orders
  add column if not exists expires_at timestamptz;

-- Set default expiry to 24 hours from creation for new orders
-- (existing orders won't get a default, so they won't auto-expire)
comment on column public.orders.expires_at is 'When this order expires if not paid. NULL means no expiry.';

-- Function to expire stale pending orders (call from pg_cron or edge function)
create or replace function public.expire_stale_orders()
returns integer
language plpgsql
security definer
as $$
declare
  expired_count integer;
begin
  update public.orders
  set status = 'cancelled',
      payment_status = 'expired'
  where status in ('pending', 'awaiting_payment')
    and payment_status != 'paid'
    and expires_at is not null
    and expires_at < now();

  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$;

-- Set expires_at automatically on new orders (24 hours)
create or replace function public.set_order_expiry()
returns trigger
language plpgsql
as $$
begin
  if NEW.expires_at is null then
    NEW.expires_at := now() + interval '24 hours';
  end if;
  return NEW;
end;
$$;

drop trigger if exists tr_set_order_expiry on public.orders;
create trigger tr_set_order_expiry
  before insert on public.orders
  for each row
  execute function public.set_order_expiry();

-- ============================================================
-- 48. updated_at triggers
-- ============================================================

-- Generic updated_at trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

-- Apply to all tables that have an updated_at column
do $$
declare
  tbl text;
begin
  for tbl in
    select table_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name = 'updated_at'
      and table_name not like 'pg_%'
  loop
    execute format(
      'drop trigger if exists tr_set_updated_at on public.%I; '
      'create trigger tr_set_updated_at before update on public.%I '
      'for each row execute function public.set_updated_at();',
      tbl, tbl
    );
  end loop;
end;
$$;

-- ============================================================
-- 49. Admin audit trail
-- ============================================================

-- Admin audit log table
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;

-- Only admins can read the audit log
create policy "Admins can read audit log"
  on public.admin_audit_log for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Service role can insert (API routes use service role)
-- No insert policy needed since service role bypasses RLS

create index if not exists idx_admin_audit_log_actor on public.admin_audit_log(actor_user_id);
create index if not exists idx_admin_audit_log_action on public.admin_audit_log(action);
create index if not exists idx_admin_audit_log_created on public.admin_audit_log(created_at desc);
