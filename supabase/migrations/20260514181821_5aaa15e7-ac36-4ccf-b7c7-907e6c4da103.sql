-- Drop the PUBLIC policy that exposed contact_phone/contact_email to anon
DROP POLICY IF EXISTS "Anyone can view published diaspora projects" ON public.investments;

-- Replace with an authenticated-only equivalent
CREATE POLICY "Authenticated users can view published projects"
  ON public.investments
  FOR SELECT
  TO authenticated
  USING (status = 'published');

-- Public view without PII for anonymous browsing
CREATE OR REPLACE VIEW public.investments_public
WITH (security_invoker = on) AS
SELECT
  id, title, description, full_content, category,
  target_amount, current_amount, currency,
  author_id, island, location, status, images,
  deadline, min_investment, views,
  created_at, updated_at
FROM public.investments
WHERE status = 'published';

GRANT SELECT ON public.investments_public TO anon, authenticated;

-- Also need a permissive policy on the underlying table so the view
-- (security_invoker) lets anon read non-PII rows through it.
CREATE POLICY "Anon read published via public view"
  ON public.investments
  FOR SELECT
  TO anon
  USING (status = 'published');

-- Re-apply column revoke so even though the policy above allows the row,
-- anon cannot select contact columns.
REVOKE SELECT ON public.investments FROM anon;
GRANT SELECT (
  id, title, description, full_content, category,
  target_amount, current_amount, currency,
  author_id, island, location, status, images,
  deadline, min_investment, views,
  created_at, updated_at
) ON public.investments TO anon;
