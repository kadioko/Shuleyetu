-- Newsletter subscribers table
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  source text not null default 'footer',
  unique(email)
);

-- Allow service role to insert (no RLS needed for public signup)
alter table public.newsletter_subscribers enable row level security;

-- Public can insert (subscribe) but not read others
create policy "Anyone can subscribe"
  on public.newsletter_subscribers for insert
  to anon, authenticated
  with check (true);
