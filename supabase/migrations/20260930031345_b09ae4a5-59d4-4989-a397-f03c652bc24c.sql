DROP POLICY IF EXISTS "Anyone can view freelance reviews" ON public.freelance_reviews;
CREATE POLICY "Signed-in users can view freelance reviews" ON public.freelance_reviews FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
REVOKE SELECT ON public.freelance_reviews FROM anon;