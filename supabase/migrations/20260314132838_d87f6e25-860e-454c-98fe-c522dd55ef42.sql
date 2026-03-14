-- static_pages: only admins can delete
CREATE POLICY "Admins can delete static pages"
ON public.static_pages FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- reports: admins and moderators can delete
CREATE POLICY "Admins and moderators can delete reports"
ON public.reports FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role));

-- pending_modifications: admins and moderators can delete
CREATE POLICY "Admins and moderators can delete pending modifications"
ON public.pending_modifications FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role));