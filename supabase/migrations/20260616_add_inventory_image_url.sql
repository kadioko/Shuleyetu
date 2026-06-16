-- Add image_url column to inventory for product photos
alter table public.inventory
add column image_url text;

comment on column public.inventory.image_url is 'URL to product image (Cloudinary, Supabase Storage, or external CDN)';
