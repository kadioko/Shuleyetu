-- Tighten storage RLS policies: only linked vendor users can upload/modify
-- products and vendor images. The folder structure is: {vendor_id}/filename

-- Drop overly permissive policies
drop policy if exists "Authenticated users can upload products" on storage.objects;
drop policy if exists "Authenticated users can upload vendors" on storage.objects;
drop policy if exists "Users can update own products" on storage.objects;
drop policy if exists "Users can delete own products" on storage.objects;
drop policy if exists "Users can update own vendors" on storage.objects;
drop policy if exists "Users can delete own vendors" on storage.objects;

-- Products bucket: only vendor members can upload/update/delete
-- Folder structure expected: {vendor_id}/filename.ext
create policy "Vendor members can upload products"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'products'
  and exists (
    select 1 from public.vendor_users
    where vendor_users.user_id = auth.uid()
      and vendor_users.vendor_id::text = (storage.foldername(name))[1]
  )
);

create policy "Vendor members can update products"
on storage.objects for update
to authenticated
using (
  bucket_id = 'products'
  and exists (
    select 1 from public.vendor_users
    where vendor_users.user_id = auth.uid()
      and vendor_users.vendor_id::text = (storage.foldername(name))[1]
  )
);

create policy "Vendor members can delete products"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'products'
  and exists (
    select 1 from public.vendor_users
    where vendor_users.user_id = auth.uid()
      and vendor_users.vendor_id::text = (storage.foldername(name))[1]
  )
);

-- Vendors bucket: only linked vendor users can upload/modify logos
create policy "Vendor members can upload vendor files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'vendors'
  and exists (
    select 1 from public.vendor_users
    where vendor_users.user_id = auth.uid()
      and vendor_users.vendor_id::text = (storage.foldername(name))[1]
  )
);

create policy "Vendor members can update vendor files"
on storage.objects for update
to authenticated
using (
  bucket_id = 'vendors'
  and exists (
    select 1 from public.vendor_users
    where vendor_users.user_id = auth.uid()
      and vendor_users.vendor_id::text = (storage.foldername(name))[1]
  )
);

create policy "Vendor members can delete vendor files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'vendors'
  and exists (
    select 1 from public.vendor_users
    where vendor_users.user_id = auth.uid()
      and vendor_users.vendor_id::text = (storage.foldername(name))[1]
  )
);
