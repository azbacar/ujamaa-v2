ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS images text[],
  ADD COLUMN IF NOT EXISTS price numeric,
  ADD COLUMN IF NOT EXISTS service_subtype text,
  ADD COLUMN IF NOT EXISTS location text;