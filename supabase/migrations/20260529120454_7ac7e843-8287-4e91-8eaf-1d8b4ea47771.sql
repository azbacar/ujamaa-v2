-- Allow the public freelancer directory view to return visible profiles to anonymous visitors.
-- Sensitive columns such as whatsapp remain excluded/revoked; this only exposes the public profile fields already used by the directory.
CREATE POLICY "Anon can view visible freelancer profiles"
ON public.freelancer_profiles
FOR SELECT
TO anon
USING (is_visible = true);

-- Ensure the public directory view remains reachable through the Data API.
GRANT SELECT ON public.freelancer_profiles_public TO anon, authenticated;
GRANT SELECT ON public.users_pro_status TO anon, authenticated;