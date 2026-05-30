
-- 1. content_items: hide contact PII from anonymous visitors
REVOKE SELECT (contact_phone, contact_whatsapp) ON public.content_items FROM anon;

-- 2. gastronomy_items: hide contact PII from anonymous visitors
REVOKE SELECT (contact_phone, contact_email, contact_whatsapp) ON public.gastronomy_items FROM anon;

-- 3. investments: hide contact PII from anonymous visitors
REVOKE SELECT (contact_phone, contact_email) ON public.investments FROM anon;

-- 4. freelancer_profiles: hide rates and social URLs from anonymous visitors
REVOKE SELECT (whatsapp, hourly_rate_min, hourly_rate_max, facebook_url, linkedin_url, twitter_url, instagram_url) ON public.freelancer_profiles FROM anon;

-- 5. users: hide email from broad authenticated SELECT; keep self-read via auth.users, admin via service_role/policy
REVOKE SELECT (email) ON public.users FROM anon, authenticated;
-- Re-grant to service_role to ensure edge functions still work
GRANT SELECT (email) ON public.users TO service_role;

-- 6. Secure RPC so legitimate flows (invite partner, link CRM client) can resolve an email -> user_id without exposing the column
CREATE OR REPLACE FUNCTION public.lookup_user_id_by_email(_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.users WHERE lower(email) = lower(_email) LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lookup_user_id_by_email(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.lookup_user_id_by_email(text) TO authenticated, service_role;
