-- Add explicit UPDATE policy for moderators on events with WITH CHECK
-- This ensures moderators can change status from draft to published
CREATE POLICY "Moderators can update any event status"
ON public.events FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));