-- Allow moderators to view all prices
CREATE POLICY "Moderators can view all prices"
ON public.prices
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Allow moderators to update any price
CREATE POLICY "Moderators can update all prices"
ON public.prices
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));

-- Allow moderators to delete any price
CREATE POLICY "Moderators can delete all prices"
ON public.prices
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));