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
