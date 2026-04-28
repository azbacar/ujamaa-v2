
-- 1) FREELANCER_PROFILES
DROP POLICY IF EXISTS "Anyone can view visible freelancer profiles" ON public.freelancer_profiles;

CREATE POLICY "Authenticated can view visible freelancer profiles"
ON public.freelancer_profiles
FOR SELECT
TO authenticated
USING (is_visible = true OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE VIEW public.freelancer_profiles_public
WITH (security_invoker = true) AS
SELECT
  id, user_id, display_name, bio, skills,
  hourly_rate_min, hourly_rate_max, currency,
  experience_years, portfolio_url, island, location,
  is_available, is_visible, avatar_url, views,
  created_at, updated_at
FROM public.freelancer_profiles
WHERE is_visible = true;

GRANT SELECT ON public.freelancer_profiles_public TO anon, authenticated;

-- 2) ENTERPRISE_PROFILES
DROP POLICY IF EXISTS "Authenticated can view active enterprises" ON public.enterprise_profiles;

CREATE POLICY "Owners and admins view enterprise raw"
ON public.enterprise_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname='public' AND viewname='enterprise_profiles_public') THEN
    EXECUTE 'ALTER VIEW public.enterprise_profiles_public SET (security_invoker = true)';
  END IF;
END $$;

-- 3) PROJECT_CARRIERS
DROP POLICY IF EXISTS "Authenticated can view active carrier basic info" ON public.project_carriers;

CREATE POLICY "Owners and admins view carriers raw"
ON public.project_carriers
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname='public' AND viewname='project_carriers_public') THEN
    EXECUTE 'ALTER VIEW public.project_carriers_public SET (security_invoker = true)';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname='public' AND viewname='users_pro_status') THEN
    EXECUTE 'ALTER VIEW public.users_pro_status SET (security_invoker = true)';
  END IF;
END $$;

-- COMPTEURS DE VUES
CREATE OR REPLACE FUNCTION public.increment_content_view(_type text, _id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CASE _type
    WHEN 'content_item' THEN
      UPDATE public.content_items SET views = COALESCE(views, 0) + 1 WHERE id = _id;
    WHEN 'event' THEN
      UPDATE public.events SET views = COALESCE(views, 0) + 1 WHERE id = _id;
    WHEN 'diaspora_project' THEN
      UPDATE public.diaspora_projects SET views = COALESCE(views, 0) + 1 WHERE id = _id;
    WHEN 'freelance_job' THEN
      UPDATE public.freelance_jobs SET views = COALESCE(views, 0) + 1 WHERE id = _id;
    WHEN 'price' THEN
      UPDATE public.prices SET views = COALESCE(views, 0) + 1 WHERE id = _id;
    ELSE
      RAISE NOTICE 'Unknown content type: %', _type;
  END CASE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_content_view(text, uuid) TO anon, authenticated;
