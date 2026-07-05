-- Add image_url column to inventory for product photos
alter table public.inventory
add column image_url text;

comment on column public.inventory.image_url is 'URL to product image (Cloudinary, Supabase Storage, or external CDN)';
-- Order messaging between parents/customers and vendors

create table public.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  
  -- Sender info
  sender_name text not null,
  sender_role text not null check (sender_role in ('customer', 'vendor')),
  sender_user_id uuid references auth.users(id) on delete set null,
  
  -- Message content
  content text not null check (length(content) > 0 and length(content) <= 2000),
  
  -- Optional: link to a file/image
  attachment_url text,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast message lookup per order
create index order_messages_order_id_idx on public.order_messages(order_id, created_at desc);

-- Enable RLS
alter table public.order_messages enable row level security;

-- Anyone who knows the order can read messages (via order link)
create policy "Anyone with order access can read messages"
  on public.order_messages for select
  using (true);

-- Authenticated users can send messages
create policy "Authenticated users can send messages"
  on public.order_messages for insert
  to authenticated
  with check (true);
-- Performance indexes for hot query paths

-- Orders: vendor lookup + date sorting (analytics, dashboard orders)
create index if not exists orders_vendor_id_created_at_idx on public.orders(vendor_id, created_at desc);

-- Orders: vendor + status filtering (dashboard order filters)
create index if not exists orders_vendor_id_status_idx on public.orders(vendor_id, status);

-- Orders: public token lookup (order tracking, payment pages)
create index if not exists orders_public_access_token_idx on public.orders(public_access_token);

-- Orders: payment status for revenue calculations
create index if not exists orders_payment_status_idx on public.orders(payment_status) where payment_status = 'paid';

-- Vendor users: user lookup (auth, dashboard)
create index if not exists vendor_users_user_id_idx on public.vendor_users(user_id);

-- Vendor users: vendor lookup (admin panel)
create index if not exists vendor_users_vendor_id_idx on public.vendor_users(vendor_id);

-- Inventory: category filtering (vendor storefront browsing)
create index if not exists inventory_vendor_id_category_idx on public.inventory(vendor_id, category);

-- Inventory: active items only (common filter)
create index if not exists inventory_active_vendor_idx on public.inventory(vendor_id) where is_active = true;
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
