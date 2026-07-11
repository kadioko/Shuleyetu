-- Atomic order creation with stock validation and decrement.
-- Prevents overselling via SELECT FOR UPDATE row locking.

-- Ensure delivery_address column exists before the RPC references it.
alter table public.orders
  add column if not exists delivery_address text;

create or replace function public.create_order_with_items(
  p_vendor_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_student_name text default null,
  p_school_name text default null,
  p_delivery_address text default null,
  p_notes text default null,
  p_items jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_order_id uuid;
  v_item record;
  v_total numeric(12,2) := 0;
  v_payment_ref text;
  v_available int;
begin
  -- Validate inputs
  if p_vendor_id is null then
    raise exception 'vendor_id is required';
  end if;
  if p_customer_name is null or trim(p_customer_name) = '' then
    raise exception 'customer_name is required';
  end if;
  if p_customer_phone is null or trim(p_customer_phone) = '' then
    raise exception 'customer_phone is required';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one item is required';
  end if;

  -- Validate stock for each item with row-level locking
  for v_item in
    select
      (elem->>'inventory_id')::uuid as inventory_id,
      (elem->>'quantity')::int as quantity,
      (elem->>'unit_price_tzs')::numeric(12,2) as unit_price
    from jsonb_array_elements(p_items) as elem
  loop
    -- Lock the inventory row and check stock
    select stock_quantity into v_available
    from public.inventory
    where id = v_item.inventory_id
      and vendor_id = p_vendor_id
    for update;

    if not found then
      raise exception 'Item % not found for this vendor', v_item.inventory_id;
    end if;

    if v_item.quantity <= 0 then
      raise exception 'Quantity must be positive for item %', v_item.inventory_id;
    end if;

    if v_item.quantity > v_available then
      raise exception 'Insufficient stock for item %. Requested: %, Available: %',
        v_item.inventory_id, v_item.quantity, v_available;
    end if;

    v_total := v_total + (v_item.unit_price * v_item.quantity);
  end loop;

  -- Generate a unique payment reference
  v_payment_ref := 'SHU-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));

  -- Create the order
  insert into public.orders (
    vendor_id,
    customer_name,
    customer_phone,
    student_name,
    school_name,
    delivery_address,
    notes,
    total_amount_tzs,
    payment_reference,
    status,
    payment_status
  ) values (
    p_vendor_id,
    trim(p_customer_name),
    trim(p_customer_phone),
    nullif(trim(coalesce(p_student_name, '')), ''),
    nullif(trim(coalesce(p_school_name, '')), ''),
    nullif(trim(coalesce(p_delivery_address, '')), ''),
    nullif(trim(coalesce(p_notes, '')), ''),
    v_total,
    v_payment_ref,
    'pending',
    'unpaid'
  )
  returning id into v_order_id;

  -- Insert order items and decrement stock
  for v_item in
    select
      (elem->>'inventory_id')::uuid as inventory_id,
      (elem->>'quantity')::int as quantity,
      (elem->>'unit_price_tzs')::numeric(12,2) as unit_price
    from jsonb_array_elements(p_items) as elem
  loop
    insert into public.order_items (
      order_id,
      inventory_id,
      quantity,
      unit_price_tzs
    ) values (
      v_order_id,
      v_item.inventory_id,
      v_item.quantity,
      v_item.unit_price
    );

    -- Decrement stock
    update public.inventory
    set stock_quantity = stock_quantity - v_item.quantity
    where id = v_item.inventory_id;
  end loop;

  return jsonb_build_object(
    'order_id', v_order_id,
    'payment_reference', v_payment_ref,
    'total_amount_tzs', v_total
  );
end;
$$;

-- Add a check constraint to prevent negative stock
alter table public.inventory
  drop constraint if exists inventory_stock_non_negative;
alter table public.inventory
  add constraint inventory_stock_non_negative
  check (stock_quantity >= 0);

-- Add unique constraint on payment_reference to prevent collisions
alter table public.orders
  drop constraint if exists orders_payment_reference_unique;
alter table public.orders
  add constraint orders_payment_reference_unique
  unique (payment_reference);
