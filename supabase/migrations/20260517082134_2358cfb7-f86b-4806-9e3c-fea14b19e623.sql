-- Drop the overly permissive authenticated SELECT policy
DROP POLICY IF EXISTS "Authenticated can read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Authenticated users can read site settings" ON public.site_settings;

-- Ensure an admin-only SELECT policy exists
DROP POLICY IF EXISTS "Admins can read all site settings" ON public.site_settings;
CREATE POLICY "Admins can read all site settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));