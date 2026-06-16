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
