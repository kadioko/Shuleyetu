-- Reconcile remote database with the schema expected by the Shuleyetu app.
-- This migration is idempotent: it only creates missing objects and skips
-- anything that already exists. It is safe to run against the live project.

-- ---------------------------------------------------------------------------
-- Types (safe wrappers in case they already exist)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  CREATE TYPE public.item_category AS ENUM ('textbook', 'uniform', 'stationery', 'other');
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.order_status AS ENUM (
    'pending', 'awaiting_payment', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.payment_status AS ENUM ('unpaid', 'pending', 'paid', 'refunded', 'failed');
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Missing tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  inventory_id uuid not null references public.inventory(id),
  quantity integer not null default 1,
  unit_price_tzs numeric(12,2) not null,
  total_price_tzs numeric(12,2) generated always as (quantity * unit_price_tzs) stored,
  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.vendor_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, vendor_id)
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sender_name text not null,
  sender_role text not null check (sender_role in ('customer', 'vendor')),
  sender_user_id uuid references auth.users(id) on delete set null,
  content text not null check (length(content) > 0 and length(content) <= 2000),
  attachment_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.vendor_reviews (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  reviewer_name text,
  reviewer_email text,
  rating integer not null check (rating >= 1 and rating <= 5),
  title text,
  comment text,
  is_approved boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Missing columns on existing tables
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS public_access_token uuid;

UPDATE public.orders
SET public_access_token = gen_random_uuid()
WHERE public_access_token IS NULL;

ALTER TABLE public.orders
  ALTER COLUMN public_access_token SET DEFAULT gen_random_uuid();

ALTER TABLE public.orders
  ALTER COLUMN public_access_token SET NOT NULL;

ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS image_url text;

-- ---------------------------------------------------------------------------
-- Enable RLS on all application tables
-- ---------------------------------------------------------------------------
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- RLS policies: vendors
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public select vendors" ON public.vendors;
CREATE POLICY "Public select vendors" ON public.vendors FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Vendor manage own vendor" ON public.vendors;
CREATE POLICY "Vendor manage own vendor" ON public.vendors FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_users vu
      WHERE vu.vendor_id = vendors.id AND vu.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendor_users vu
      WHERE vu.vendor_id = vendors.id AND vu.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins manage all vendors" ON public.vendors;
CREATE POLICY "Admins manage all vendors" ON public.vendors FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- RLS policies: vendor_users
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Vendor users see own rows" ON public.vendor_users;
CREATE POLICY "Vendor users see own rows" ON public.vendor_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS policies: inventory
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public select inventory" ON public.inventory;
CREATE POLICY "Public select inventory" ON public.inventory FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Vendor manage own inventory" ON public.inventory;
CREATE POLICY "Vendor manage own inventory" ON public.inventory FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_users vu
      WHERE vu.vendor_id = inventory.vendor_id AND vu.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendor_users vu
      WHERE vu.vendor_id = inventory.vendor_id AND vu.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins manage all inventory" ON public.inventory;
CREATE POLICY "Admins manage all inventory" ON public.inventory FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- RLS policies: orders
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Vendors select own orders" ON public.orders;
CREATE POLICY "Vendors select own orders" ON public.orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_users vu
      WHERE vu.vendor_id = orders.vendor_id AND vu.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Vendors update own orders" ON public.orders;
CREATE POLICY "Vendors update own orders" ON public.orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_users vu
      WHERE vu.vendor_id = orders.vendor_id AND vu.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins manage all orders" ON public.orders;
CREATE POLICY "Admins manage all orders" ON public.orders FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- RLS policies: order_items
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public insert order_items" ON public.order_items;
CREATE POLICY "Public insert order_items" ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id)
  );

DROP POLICY IF EXISTS "Vendors select own order_items" ON public.order_items;
CREATE POLICY "Vendors select own order_items" ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.vendor_users vu ON vu.vendor_id = o.vendor_id
      WHERE o.id = order_items.order_id AND vu.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Vendors update own order_items" ON public.order_items;
CREATE POLICY "Vendors update own order_items" ON public.order_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.vendor_users vu ON vu.vendor_id = o.vendor_id
      WHERE o.id = order_items.order_id AND vu.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins manage all order_items" ON public.order_items;
CREATE POLICY "Admins manage all order_items" ON public.order_items FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- RLS policies: order_messages
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone with order access can read messages" ON public.order_messages;
CREATE POLICY "Anyone with order access can read messages" ON public.order_messages FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.order_messages;
CREATE POLICY "Authenticated users can send messages" ON public.order_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- RLS policies: vendor_reviews
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read approved reviews" ON public.vendor_reviews;
CREATE POLICY "Anyone can read approved reviews" ON public.vendor_reviews FOR SELECT
  USING (is_approved = true);

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.vendor_reviews;
CREATE POLICY "Authenticated users can create reviews" ON public.vendor_reviews FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- RLS policies: contact_messages
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can submit a contact message" ON public.contact_messages;
CREATE POLICY "Anyone can submit a contact message" ON public.contact_messages FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read contact messages" ON public.contact_messages;
CREATE POLICY "Admins can read contact messages" ON public.contact_messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT u.id
  FROM auth.users u
  WHERE lower(u.email) = lower(p_email)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_user_id_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO service_role;

CREATE OR REPLACE FUNCTION public.get_user_emails_by_ids(p_user_ids uuid[])
RETURNS TABLE (user_id uuid, email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT u.id AS user_id, u.email
  FROM auth.users u
  WHERE u.id = ANY(p_user_ids);
$$;

REVOKE ALL ON FUNCTION public.get_user_emails_by_ids(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_emails_by_ids(uuid[]) TO service_role;

CREATE OR REPLACE FUNCTION public.get_vendor_average_rating(vendor_uuid uuid)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(AVG(rating), 0)::numeric(3,2)
  FROM public.vendor_reviews
  WHERE vendor_id = vendor_uuid AND is_approved = true;
$$;

CREATE OR REPLACE FUNCTION public.get_vendor_review_count(vendor_uuid uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::integer
  FROM public.vendor_reviews
  WHERE vendor_id = vendor_uuid AND is_approved = true;
$$;

-- ---------------------------------------------------------------------------
-- Storage buckets for product/vendor images
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products', 'products', true, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendors', 'vendors', true, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read access for products" ON storage.objects;
CREATE POLICY "Public read access for products" ON storage.objects FOR SELECT
  USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Authenticated users can upload products" ON storage.objects;
CREATE POLICY "Authenticated users can upload products" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'products');

DROP POLICY IF EXISTS "Users can update own products" ON storage.objects;
CREATE POLICY "Users can update own products" ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own products" ON storage.objects;
CREATE POLICY "Users can delete own products" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Public read access for vendors" ON storage.objects;
CREATE POLICY "Public read access for vendors" ON storage.objects FOR SELECT
  USING (bucket_id = 'vendors');

DROP POLICY IF EXISTS "Authenticated users can upload vendors" ON storage.objects;
CREATE POLICY "Authenticated users can upload vendors" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'vendors');

DROP POLICY IF EXISTS "Users can update own vendors" ON storage.objects;
CREATE POLICY "Users can update own vendors" ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'vendors' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own vendors" ON storage.objects;
CREATE POLICY "Users can delete own vendors" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'vendors' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_inventory_id_idx ON public.order_items(inventory_id);
CREATE INDEX IF NOT EXISTS vendor_users_user_id_idx ON public.vendor_users(user_id);
CREATE INDEX IF NOT EXISTS vendor_users_vendor_id_idx ON public.vendor_users(vendor_id);
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS orders_public_access_token_idx ON public.orders(public_access_token);
CREATE UNIQUE INDEX IF NOT EXISTS orders_public_access_token_unique_idx ON public.orders(public_access_token);
CREATE INDEX IF NOT EXISTS orders_vendor_id_created_at_idx ON public.orders(vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_vendor_id_status_idx ON public.orders(vendor_id, status);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON public.orders(payment_status) WHERE payment_status = 'paid';
CREATE INDEX IF NOT EXISTS inventory_vendor_id_category_idx ON public.inventory(vendor_id, category);
CREATE INDEX IF NOT EXISTS inventory_active_vendor_idx ON public.inventory(vendor_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS order_messages_order_id_idx ON public.order_messages(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS vendor_reviews_vendor_id_idx ON public.vendor_reviews(vendor_id);
CREATE INDEX IF NOT EXISTS vendor_reviews_order_id_idx ON public.vendor_reviews(order_id);
CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx ON public.contact_messages(created_at DESC);
