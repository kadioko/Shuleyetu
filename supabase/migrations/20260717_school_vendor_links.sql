-- School-vendor recommendation links
-- Allows schools to recommend/endorse specific vendors, and enables parents
-- to filter vendors by their child's school.

create table if not exists public.school_vendor_links (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  is_recommended boolean not null default true,
  priority integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, vendor_id)
);

create index if not exists school_vendor_links_school_id_idx on public.school_vendor_links(school_id);
create index if not exists school_vendor_links_vendor_id_idx on public.school_vendor_links(vendor_id);

-- RLS: allow public read of recommended links; restrict writes to school users/admins
alter table public.school_vendor_links enable row level security;

-- Public read for recommended vendors
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'school_vendor_links' and policyname = 'school_vendor_links_public_read'
  ) then
    create policy school_vendor_links_public_read
      on public.school_vendor_links
      for select
      using (is_recommended = true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'school_vendor_links' and policyname = 'school_vendor_links_school_manage'
  ) then
    create policy school_vendor_links_school_manage
      on public.school_vendor_links
      for all
      to authenticated
      using (
        exists (
          select 1 from public.school_users su
          where su.school_id = school_vendor_links.school_id
            and su.user_id = auth.uid()
            and su.role in ('admin', 'staff', 'support')
        )
      )
      with check (
        exists (
          select 1 from public.school_users su
          where su.school_id = school_vendor_links.school_id
            and su.user_id = auth.uid()
            and su.role in ('admin', 'staff', 'support')
        )
      );
  end if;
end $$;

-- Trigger to keep updated_at current
create or replace function public.update_school_vendor_links_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists school_vendor_links_updated_at on public.school_vendor_links;
create trigger school_vendor_links_updated_at
  before update on public.school_vendor_links
  for each row
  execute function public.update_school_vendor_links_updated_at();

-- Seed demo recommendations for the demo school (only if demo school exists)
insert into public.school_vendor_links (school_id, vendor_id, is_recommended, priority, notes)
select
  s.id as school_id,
  v.id as vendor_id,
  true as is_recommended,
  case v.name
    when 'Mwanza Book Center' then 1
    when 'Dar School Supplies' then 2
    when 'Arusha EduMart' then 3
    else 4
  end as priority,
  'Recommended vendor for demo school families' as notes
from public.schools s
join public.vendors v on v.region in ('Mwanza', 'Dar es Salaam', 'Arusha', 'Dodoma')
where s.email = 'demo@shuleyetu.test'
  and s.is_active = true
  and v.is_active = true
  and v.approval_status = 'approved'
  and not exists (
    select 1 from public.school_vendor_links l
    where l.school_id = s.id and l.vendor_id = v.id
  );
