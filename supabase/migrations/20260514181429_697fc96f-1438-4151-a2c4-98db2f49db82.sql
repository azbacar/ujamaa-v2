-- Tighten enterprise viewer policy to be explicit about NULL handling
DROP POLICY IF EXISTS "Enterprise owners can view own submissions" ON public.tender_submissions;

CREATE POLICY "Enterprise owners can view own submissions"
  ON public.tender_submissions
  FOR SELECT
  TO authenticated
  USING (
    enterprise_id IS NOT NULL
    AND enterprise_id = public.get_enterprise_id(auth.uid())
  );

-- Same for update/delete pending policies (defensive)
DROP POLICY IF EXISTS "Enterprise owners can update pending submissions" ON public.tender_submissions;
CREATE POLICY "Enterprise owners can update pending submissions"
  ON public.tender_submissions
  FOR UPDATE
  TO authenticated
  USING (
    enterprise_id IS NOT NULL
    AND enterprise_id = public.get_enterprise_id(auth.uid())
    AND status = 'pending'
  )
  WITH CHECK (
    enterprise_id IS NOT NULL
    AND enterprise_id = public.get_enterprise_id(auth.uid())
    AND status = 'pending'
  );

DROP POLICY IF EXISTS "Enterprise owners can delete pending submissions" ON public.tender_submissions;
CREATE POLICY "Enterprise owners can delete pending submissions"
  ON public.tender_submissions
  FOR DELETE
  TO authenticated
  USING (
    enterprise_id IS NOT NULL
    AND enterprise_id = public.get_enterprise_id(auth.uid())
    AND status = 'pending'
  );
