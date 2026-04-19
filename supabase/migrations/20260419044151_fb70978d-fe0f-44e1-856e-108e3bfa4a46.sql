-- Table de positions GPS en direct pour vendeurs ambulants Pro
CREATE TABLE public.vendor_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL,
  category text,
  island text,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  accuracy numeric,
  heading numeric,
  speed numeric,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendor_locations_active ON public.vendor_locations (is_active, expires_at) WHERE is_active = true;
CREATE INDEX idx_vendor_locations_user ON public.vendor_locations (user_id);

ALTER TABLE public.vendor_locations ENABLE ROW LEVEL SECURITY;

-- Public : voir uniquement les positions actives non expirées
CREATE POLICY "Public can view active vendor locations"
ON public.vendor_locations FOR SELECT
USING (is_active = true AND expires_at > now());

-- Vendeur : voir ses propres positions
CREATE POLICY "Users view own vendor locations"
ON public.vendor_locations FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Vendeur Pro : créer sa position
CREATE POLICY "Pro annonceurs can insert own location"
ON public.vendor_locations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND public.is_pro_annonceur(auth.uid()));

-- Vendeur : mettre à jour sa position
CREATE POLICY "Users update own vendor location"
ON public.vendor_locations FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Vendeur : supprimer sa position
CREATE POLICY "Users delete own vendor location"
ON public.vendor_locations FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Admin : tout gérer
CREATE POLICY "Admins manage all vendor locations"
ON public.vendor_locations FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Bloquer anonymes pour modifs
CREATE POLICY "vendor_locations_deny_anon_writes"
ON public.vendor_locations FOR ALL
TO anon
USING (false);

-- Trigger updated_at + last_seen_at
CREATE OR REPLACE FUNCTION public.update_vendor_location_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_seen_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_vendor_locations_updated
BEFORE UPDATE ON public.vendor_locations
FOR EACH ROW EXECUTE FUNCTION public.update_vendor_location_timestamps();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendor_locations;
ALTER TABLE public.vendor_locations REPLICA IDENTITY FULL;