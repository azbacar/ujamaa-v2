-- Allow public profile basics needed by the security-invoker users_pro_status view.
-- Only id, username and avatar_url are granted; email and account_type remain inaccessible directly.
DROP POLICY IF EXISTS "Public can view user profile basics" ON public.users;

CREATE POLICY "Public can view user profile basics"
ON public.users
FOR SELECT
TO anon, authenticated
USING (true);

GRANT SELECT (id, username, avatar_url) ON public.users TO anon, authenticated;
GRANT ALL ON public.users TO service_role;

-- Keep public Pro status view reachable. is_pro is computed through the protected is_pro_user() function.
GRANT SELECT ON public.users_pro_status TO anon, authenticated;