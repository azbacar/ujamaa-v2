-- Allow the public website to display scheduled/active ads
-- (RLS is enabled on public.ads, so without a SELECT policy the homepage cannot show ads)

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Public can view only currently active & scheduled ads
DROP POLICY IF EXISTS "Public can view active ads" ON public.ads;
CREATE POLICY "Public can view active ads"
ON public.ads
FOR SELECT
USING (
  is_active = true
  AND (start_date IS NULL OR start_date <= now())
  AND (end_date IS NULL OR end_date >= now())
);
