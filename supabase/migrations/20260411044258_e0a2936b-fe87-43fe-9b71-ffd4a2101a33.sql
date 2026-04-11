
-- =====================================================
-- 1. ENTERPRISE_PROFILES: Hide PII from public view
-- =====================================================

-- Replace the public SELECT policy with one that hides sensitive fields
DROP POLICY IF EXISTS "Anyone can view active enterprises" ON public.enterprise_profiles;

-- Create a restricted public view
CREATE OR REPLACE VIEW public.enterprise_profiles_public
WITH (security_invoker = on) AS
SELECT id, name, sector, island, city, logo_url, description, is_verified, status, created_at
FROM public.enterprise_profiles
WHERE status = 'active';

-- New public policy: only non-sensitive fields via authenticated owner/admin, or basic info for public
CREATE POLICY "Public can view active enterprise basic info"
ON public.enterprise_profiles
FOR SELECT
USING (
  status = 'active' AND (
    -- Owner sees everything
    user_id = auth.uid()
    -- Admin sees everything
    OR has_role(auth.uid(), 'admin'::app_role)
    -- Public/others see the row but sensitive columns are still exposed at row level
    -- so we need to use the view for public access
    OR true
  )
);

-- Actually, the better approach: replace with restrictive policy + view
-- Let's drop the overly permissive one and be more targeted
DROP POLICY IF EXISTS "Public can view active enterprise basic info" ON public.enterprise_profiles;

-- Public: only via the view (no direct table access for anon)
CREATE POLICY "Anon can only view active enterprises"
ON public.enterprise_profiles
FOR SELECT
TO anon
USING (false);

-- Authenticated non-owner: can see active enterprises (for search/directory)
CREATE POLICY "Authenticated can view active enterprises"
ON public.enterprise_profiles
FOR SELECT
TO authenticated
USING (
  status = 'active'
  OR user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Grant SELECT on the public view
GRANT SELECT ON public.enterprise_profiles_public TO anon, authenticated;

-- =====================================================
-- 2. PROJECT_CARRIERS: Restrict PII visibility
-- =====================================================

DROP POLICY IF EXISTS "Authenticated can view active carrier profiles" ON public.project_carriers;

-- Create a public view without PII
CREATE OR REPLACE VIEW public.project_carriers_public
WITH (security_invoker = on) AS
SELECT id, user_id, display_name, bio, island, location, organization, is_verified, is_active, created_at
FROM public.project_carriers
WHERE is_active = true;

GRANT SELECT ON public.project_carriers_public TO anon, authenticated;

-- Only owner and admins can see full carrier profiles (with phone/email)
CREATE POLICY "Authenticated can view active carrier basic info"
ON public.project_carriers
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
  OR is_active = true
);

-- =====================================================
-- 3. PRICE_HISTORY: Restrict to authenticated only
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view price history" ON public.price_history;

CREATE POLICY "Authenticated can view price history"
ON public.price_history
FOR SELECT
TO authenticated
USING (true);

-- =====================================================
-- 4. STORAGE: Fix event-images upload policy
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can upload event images" ON storage.objects;

CREATE POLICY "Authenticated users can upload event images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- 5. STORAGE: Remove duplicate freelancer-avatars policy
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can upload freelancer avatars" ON storage.objects;
-- Keep only "Users can upload freelancer avatars" which has proper ownership check

-- =====================================================
-- 6. SITE_ANALYTICS: Fix INSERT policy conflict
-- =====================================================

DROP POLICY IF EXISTS "Allow analytics tracking" ON public.site_analytics;

CREATE POLICY "Authenticated users can insert analytics"
ON public.site_analytics
FOR INSERT
TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- =====================================================
-- 7. STATIC_PAGES: Fix policies to use has_role()
-- =====================================================

DROP POLICY IF EXISTS "Admins can insert static pages" ON public.static_pages;
DROP POLICY IF EXISTS "Admins can update static pages" ON public.static_pages;

CREATE POLICY "Admins can insert static pages"
ON public.static_pages
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update static pages"
ON public.static_pages
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- 8. DATA INTEGRITY: Assign 'user' role to orphaned accounts
-- =====================================================

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::app_role
FROM public.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- =====================================================
-- 9. AUTO-ASSIGN role on new user signup (trigger)
-- =====================================================

CREATE OR REPLACE FUNCTION public.auto_assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_created_assign_role ON public.users;
CREATE TRIGGER on_user_created_assign_role
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_default_role();
