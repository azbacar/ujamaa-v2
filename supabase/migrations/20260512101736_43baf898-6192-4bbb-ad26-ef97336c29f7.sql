DROP POLICY IF EXISTS "Tender authors can update submissions status" ON public.tender_submissions;
CREATE POLICY "Tender authors can update submissions status"
  ON public.tender_submissions FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.content_items ci
      WHERE ci.id = tender_submissions.tender_id
        AND ci.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.content_items ci
      WHERE ci.id = tender_submissions.tender_id
        AND ci.author_id = auth.uid()
    )
  );