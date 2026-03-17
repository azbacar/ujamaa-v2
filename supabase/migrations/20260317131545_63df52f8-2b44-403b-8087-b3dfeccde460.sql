-- Allow authors to update their own jobs regardless of status (not just draft)
DROP POLICY IF EXISTS "Authors can update own draft freelance jobs" ON public.freelance_jobs;
CREATE POLICY "Authors can update own freelance jobs"
  ON public.freelance_jobs FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());