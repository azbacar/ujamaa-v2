
-- 1) content_items: admins/moderators can modify ALL content EXCEPT tenders.
--    Tenders ('appels d'offres') remain editable only by the announcer (author).
DROP POLICY IF EXISTS "Admins and moderators can update content" ON public.content_items;

CREATE POLICY "Admins and moderators can update non-tender content"
ON public.content_items
FOR UPDATE
TO authenticated
USING (
  (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role))
  AND type <> 'tender'
)
WITH CHECK (
  (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role))
  AND type <> 'tender'
);

-- Allow author (tender owner) to update their own tender at any status (not just draft)
CREATE POLICY "Tender authors can update their own tenders"
ON public.content_items
FOR UPDATE
TO authenticated
USING (author_id = auth.uid() AND type = 'tender')
WITH CHECK (author_id = auth.uid() AND type = 'tender');

-- 2) investments: allow admins/moderators to update
CREATE POLICY "Admins and moderators can update investments"
ON public.investments
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role));
