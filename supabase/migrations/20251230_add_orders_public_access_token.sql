alter table public.orders
  add column if not exists public_access_token uuid;

update public.orders
set public_access_token = gen_random_uuid()
where public_access_token is null;

alter table public.orders
  alter column public_access_token set default gen_random_uuid();

alter table public.orders
  alter column public_access_token set not null;

create unique index if not exists orders_public_access_token_idx
  on public.orders(public_access_token);
create or replace function public.get_user_emails_by_ids(p_user_ids uuid[])
returns table (user_id uuid, email text)
language sql
security definer
set search_path = public, auth
as $$
  select u.id as user_id, u.email
  from auth.users u
  where u.id = any(p_user_ids);
$$;

revoke all on function public.get_user_emails_by_ids(uuid[]) from public;
grant execute on function public.get_user_emails_by_ids(uuid[]) to service_role;
create or replace function public.get_user_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = public, auth
as $$
  select u.id
  from auth.users u
  where lower(u.email) = lower(p_email)
  limit 1;
$$;

revoke all on function public.get_user_id_by_email(text) from public;
grant execute on function public.get_user_id_by_email(text) to service_role;
