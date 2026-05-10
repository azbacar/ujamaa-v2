
GRANT SELECT (contact_phone) ON public.partner_accounts TO anon, authenticated;

DROP VIEW IF EXISTS public.partner_accounts_public;
CREATE VIEW public.partner_accounts_public
WITH (security_invoker = true) AS
SELECT
  id, business_name, contact_phone,
  address, city, island,
  latitude, longitude, opening_hours,
  accepted_methods, is_visible_on_map, status, created_at
FROM public.partner_accounts
WHERE status = 'active' AND is_visible_on_map = true;

GRANT SELECT ON public.partner_accounts_public TO anon, authenticated;
