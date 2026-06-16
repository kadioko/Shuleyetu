-- Vendor reviews and ratings

create table public.vendor_reviews (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  
  -- Reviewer info (can be anonymous or linked to order)
  reviewer_name text,
  reviewer_email text,
  
  -- Rating (1-5 stars)
  rating integer not null check (rating >= 1 and rating <= 5),
  
  -- Review content
  title text,
  comment text,
  
  -- Moderation
  is_approved boolean not null default true,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for vendor review lookups
create index vendor_reviews_vendor_id_idx on public.vendor_reviews(vendor_id);
create index vendor_reviews_order_id_idx on public.vendor_reviews(order_id);

-- Enable RLS
alter table public.vendor_reviews enable row level security;

-- Everyone can read approved reviews
create policy "Anyone can read approved reviews"
  on public.vendor_reviews for select
  using (is_approved = true);

-- Authenticated users can create reviews
create policy "Authenticated users can create reviews"
  on public.vendor_reviews for insert
  to authenticated
  with check (true);

-- Function to get average rating for a vendor
create or replace function public.get_vendor_average_rating(vendor_uuid uuid)
returns numeric
language sql
stable
as $$
  select coalesce(avg(rating), 0)::numeric(3,2)
  from public.vendor_reviews
  where vendor_id = vendor_uuid and is_approved = true;
$$;

-- Function to get review count for a vendor
create or replace function public.get_vendor_review_count(vendor_uuid uuid)
returns integer
language sql
stable
as $$
  select count(*)::integer
  from public.vendor_reviews
  where vendor_id = vendor_uuid and is_approved = true;
$$;
