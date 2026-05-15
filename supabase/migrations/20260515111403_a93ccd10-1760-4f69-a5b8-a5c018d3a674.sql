DROP POLICY IF EXISTS "Anyone can view published gastronomy items" ON public.gastronomy_items;

CREATE POLICY "Authenticated can view published gastronomy items"
ON public.gastronomy_items
FOR SELECT
TO authenticated
USING (status = 'published');

REVOKE SELECT ON public.gastronomy_items FROM anon;
GRANT SELECT (
  id, author_id, type, title, description, price_min, price_max,
  images, location, category, views, created_at, updated_at, status,
  latitude, longitude, dining_style, accommodation_type, service_mode,
  room_types, metadata
) ON public.gastronomy_items TO anon;

CREATE POLICY "Anon can view safe columns of published gastronomy items"
ON public.gastronomy_items
FOR SELECT
TO anon
USING (status = 'published');

CREATE OR REPLACE VIEW public.gastronomy_items_public
WITH (security_invoker = on) AS
SELECT
  id, author_id, type, title, description, price_min, price_max,
  images, location, category, views, created_at, updated_at, status,
  latitude, longitude, dining_style, accommodation_type, service_mode,
  room_types, metadata
FROM public.gastronomy_items
WHERE status = 'published';

GRANT SELECT ON public.gastronomy_items_public TO anon, authenticated;