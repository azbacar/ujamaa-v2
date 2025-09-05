-- Add RLS policy for site_analytics to prevent unauthorized access
CREATE POLICY "site_analytics_deny_anon_access"
ON public.site_analytics
FOR ALL
TO anon
USING (false);

-- Add policy to prevent non-admin authenticated users from accessing analytics
CREATE POLICY "site_analytics_deny_non_admin_access"
ON public.site_analytics
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));