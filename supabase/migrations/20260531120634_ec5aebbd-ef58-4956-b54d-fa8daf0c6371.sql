
-- 1. Restrict users table: drop the overly permissive policy that exposed every row to all authenticated users
DROP POLICY IF EXISTS "Authenticated can view user basics" ON public.users;

-- Revoke direct column access to email for authenticated role (own-row policy still works for reading own email)
REVOKE SELECT (email) ON public.users FROM authenticated;

-- Re-grant the safe public columns at column-level so the app can still fetch own-row data and public lookups via SECURITY DEFINER RPC
GRANT SELECT (id, username, avatar_url, account_type, created_at, pro_features) ON public.users TO authenticated;

-- 2. Consolidate tender_submissions INSERT policies
DROP POLICY IF EXISTS "Enterprise owners can create submissions" ON public.tender_submissions;
DROP POLICY IF EXISTS "Authenticated users can create submissions" ON public.tender_submissions;

CREATE POLICY "Authenticated users can create own submissions"
  ON public.tender_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    submitter_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.content_items
      WHERE content_items.id = tender_submissions.tender_id
        AND content_items.type = 'tender'::content_type
        AND content_items.status = 'published'::content_status
    )
    AND (
      enterprise_id IS NULL
      OR enterprise_id = public.get_enterprise_id(auth.uid())
    )
  );
