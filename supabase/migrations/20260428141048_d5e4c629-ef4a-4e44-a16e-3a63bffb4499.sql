-- Lot 3: Add ambulant/fixed flag to vendor_locations
ALTER TABLE public.vendor_locations
  ADD COLUMN IF NOT EXISTS is_mobile boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS address text;

COMMENT ON COLUMN public.vendor_locations.is_mobile IS 'true = ambulant (live tracking via watchPosition), false = fixe (position unique enregistrée)';
COMMENT ON COLUMN public.vendor_locations.address IS 'Adresse / repère textuel pour les positions fixes';

CREATE INDEX IF NOT EXISTS idx_vendor_locations_active_mobile 
  ON public.vendor_locations(is_active, is_mobile) WHERE is_active = true;