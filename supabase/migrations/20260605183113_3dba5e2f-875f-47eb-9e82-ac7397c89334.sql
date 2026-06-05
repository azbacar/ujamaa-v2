
-- Drop overly permissive SELECT policies
DROP POLICY IF EXISTS "Anon can view visible freelancer profiles" ON public.freelancer_profiles;
DROP POLICY IF EXISTS "Authenticated can view visible freelancer profiles" ON public.freelancer_profiles;

-- Keep owner-self policy ("Users can view own freelancer profile") already in place.
-- Add restricted policy for admin/moderator on raw table.
CREATE POLICY "Staff can view all freelancer profiles raw"
ON public.freelancer_profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'moderator'::app_role)
);

-- Revoke anon SELECT on the raw table (defense in depth)
REVOKE SELECT ON public.freelancer_profiles FROM anon;
