-- Background job queue table for async processing (emails, webhooks, exports)
create table if not exists public.background_jobs (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed', 'cancelled')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  run_at timestamptz not null default now(),
  attempts int not null default 0,
  max_attempts int not null default 3,
  last_error text,
  worker_id text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.background_jobs enable row level security;

-- Service role only (API/cron workers bypass RLS or use service key)
create policy "Service role can manage background jobs"
  on public.background_jobs
  for all
  to service_role
  using (true)
  with check (true);

create index if not exists idx_background_jobs_status_run_at
  on public.background_jobs(status, run_at desc);

create index if not exists idx_background_jobs_type
  on public.background_jobs(type);

create index if not exists idx_background_jobs_worker
  on public.background_jobs(worker_id);

-- Atomic job claim function: picks the oldest pending/runnable job and marks it running
-- Optional p_types filter (postgres array of text, or null for all types)
create or replace function public.claim_background_job(
  p_types text[],
  p_worker_id text,
  p_now timestamptz
)
returns table (
  id uuid,
  type text,
  payload jsonb,
  attempts int
)
language plpgsql
as $$
begin
  return query
  update public.background_jobs
  set
    status = 'running',
    worker_id = p_worker_id,
    attempts = attempts + 1,
    updated_at = p_now
  where id = (
    select inner_jobs.id
    from public.background_jobs as inner_jobs
    where inner_jobs.status = 'pending'
      and inner_jobs.run_at <= p_now
      and (p_types is null or inner_jobs.type = any(p_types))
    order by
      case inner_jobs.priority
        when 'high' then 1
        when 'normal' then 2
        when 'low' then 3
      end,
      inner_jobs.run_at asc,
      inner_jobs.created_at asc
    for update skip locked
    limit 1
  )
  returning public.background_jobs.id, public.background_jobs.type, public.background_jobs.payload, public.background_jobs.attempts;
end;
$$;

-- updated_at trigger for background_jobs
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tr_set_updated_at on public.background_jobs;
create trigger tr_set_updated_at
  before update on public.background_jobs
  for each row
  execute function public.set_updated_at();
