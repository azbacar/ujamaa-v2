-- Fix 1: Restrict project_carriers INSERT to admins or annonceurs only (prevent privilege escalation)
DROP POLICY IF EXISTS "Users can create own carrier profile" ON public.project_carriers;
CREATE POLICY "Users can create own carrier profile"
  ON public.project_carriers FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      has_role(auth.uid(), 'annonceur'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- Fix 2: Replace public SELECT policy to hide email/phone from anonymous users
DROP POLICY IF EXISTS "Anyone can view active carrier profiles" ON public.project_carriers;

-- Only authenticated users can view active carriers
CREATE POLICY "Authenticated can view active carrier profiles"
  ON public.project_carriers FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Anonymous users cannot see carrier profiles
DROP POLICY IF EXISTS "project_carriers_deny_anon" ON public.project_carriers;
CREATE POLICY "project_carriers_deny_anon"
  ON public.project_carriers FOR ALL
  TO anon
  USING (false);