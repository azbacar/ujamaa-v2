DROP POLICY IF EXISTS "Owners and admins view carriers raw" ON public.project_carriers;

CREATE POLICY "Owners and admins view carriers raw"
ON public.project_carriers
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));