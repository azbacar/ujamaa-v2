-- ============================================
-- LOT 1 — Pro = GLOBAL (découplé du rôle annonceur)
-- ============================================

-- 1) is_pro_annonceur devient un alias de is_pro_user (compat ascendante)
CREATE OR REPLACE FUNCTION public.is_pro_annonceur(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.is_pro_user(_user_id);
$$;

-- 2) Helper : compte vérifié (KYC validé via announcer_privileges.privilege='verified'
--    ou enterprise_profiles.is_verified ou project_carriers.is_verified)
CREATE OR REPLACE FUNCTION public.is_verified_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.announcer_privileges
      WHERE user_id = _user_id
        AND privilege = 'verified'
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > now())
    )
    OR EXISTS (
      SELECT 1 FROM public.enterprise_profiles
      WHERE user_id = _user_id AND is_verified = true AND status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.project_carriers
      WHERE user_id = _user_id AND is_verified = true AND is_active = true
    );
$$;

-- 3) Helper : peut activer la géoloc publique
--    = Pro OU (Vérifié ET (annonceur OU freelancer OU entreprise))
CREATE OR REPLACE FUNCTION public.can_share_public_location(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    public.is_pro_user(_user_id)
    OR (
      public.is_verified_user(_user_id)
      AND (
        public.has_role(_user_id, 'annonceur'::app_role)
        OR EXISTS (SELECT 1 FROM public.freelancer_profiles WHERE user_id = _user_id)
        OR public.has_enterprise(_user_id)
      )
    );
$$;

-- 4) RLS vendor_locations : utiliser le nouveau helper
DROP POLICY IF EXISTS "Pro announcers can insert their location" ON public.vendor_locations;
DROP POLICY IF EXISTS "Pro announcers can update their location" ON public.vendor_locations;
DROP POLICY IF EXISTS "Users can insert their own location if eligible" ON public.vendor_locations;
DROP POLICY IF EXISTS "Users can update their own location if eligible" ON public.vendor_locations;
DROP POLICY IF EXISTS "Eligible users can insert their location" ON public.vendor_locations;
DROP POLICY IF EXISTS "Eligible users can update their location" ON public.vendor_locations;

CREATE POLICY "Eligible users can insert their location"
ON public.vendor_locations FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND public.can_share_public_location(auth.uid())
);

CREATE POLICY "Eligible users can update their location"
ON public.vendor_locations FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND public.can_share_public_location(auth.uid()))
WITH CHECK (user_id = auth.uid() AND public.can_share_public_location(auth.uid()));

-- 5) Trigger sync_pro_subscription_approval : ne plus forcer le rôle annonceur
CREATE OR REPLACE FUNCTION public.sync_pro_subscription_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    UPDATE public.users
    SET account_type = 'pro'
    WHERE id = NEW.user_id;
  END IF;

  IF NEW.status = 'rejected' AND OLD.status = 'approved' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.pro_subscription_requests
      WHERE user_id = NEW.user_id AND status = 'approved' AND id <> NEW.id
    ) THEN
      UPDATE public.users SET account_type = 'free' WHERE id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;