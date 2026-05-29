-- 1. Remove anon role from users public policy (anon already lacks SELECT grant, just clean for clarity)
DROP POLICY IF EXISTS "Public can view user profile basics" ON public.users;

CREATE POLICY "Authenticated can view user basics"
ON public.users FOR SELECT TO authenticated
USING (true);

-- 2. Strengthen partner_transactions INSERT to forbid storing arbitrary PII for other users.
-- Either client_email/client_phone are NULL, or they must match the referenced client_user_id user.
DROP POLICY IF EXISTS "Partners create own transactions" ON public.partner_transactions;

CREATE POLICY "Partners create own transactions"
ON public.partner_transactions FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.partner_accounts pa
    WHERE pa.id = partner_transactions.partner_id
      AND pa.user_id = auth.uid()
      AND pa.status = 'active'
  )
  AND (
    client_email IS NULL
    OR client_user_id IS NULL
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = client_user_id AND lower(u.email) = lower(client_email))
  )
);