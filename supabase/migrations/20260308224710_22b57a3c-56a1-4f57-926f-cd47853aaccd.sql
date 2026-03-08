
-- FIX 1: site_analytics - prevent user_id forgery
DROP POLICY IF EXISTS "Allow analytics tracking" ON public.site_analytics;
CREATE POLICY "Allow analytics tracking" ON public.site_analytics FOR INSERT
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- FIX 2: Update has_role to also check announcer_privileges expiry
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (
        _role != 'annonceur'
        OR NOT EXISTS (
          SELECT 1 FROM public.announcer_privileges
          WHERE announcer_privileges.user_id = _user_id
            AND announcer_privileges.is_active = false
        )
      )
      AND (
        _role != 'annonceur'
        OR NOT EXISTS (
          SELECT 1 FROM public.announcer_privileges
          WHERE announcer_privileges.user_id = _user_id
            AND announcer_privileges.expires_at IS NOT NULL
            AND announcer_privileges.expires_at < now()
            AND announcer_privileges.is_active = true
        )
      )
  )
$$;
