
-- 1) Add geolocation + display fields to partner_accounts
ALTER TABLE public.partner_accounts
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS is_visible_on_map boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS opening_hours text,
  ADD COLUMN IF NOT EXISTS accepted_methods text[] NOT NULL DEFAULT ARRAY['cash','bank_transfer']::text[];

-- 2) Add azzhy deposit commission rate to settings
ALTER TABLE public.partner_settings
  ADD COLUMN IF NOT EXISTS azzhy_deposit_commission_rate numeric NOT NULL DEFAULT 2;

-- 3) Create partner_deposits table
CREATE TABLE IF NOT EXISTS public.partner_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partner_accounts(id) ON DELETE CASCADE,
  total_collected numeric NOT NULL CHECK (total_collected > 0),
  commission_rate numeric NOT NULL DEFAULT 2,
  commission_amount numeric NOT NULL DEFAULT 0,
  net_deposited numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'FC',
  deposit_method text NOT NULL DEFAULT 'cash' CHECK (deposit_method IN ('cash','bank_transfer','mobile_money')),
  reference text,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected')),
  confirmed_by uuid,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_deposits_partner ON public.partner_deposits(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_deposits_status ON public.partner_deposits(status);
CREATE INDEX IF NOT EXISTS idx_partner_accounts_map ON public.partner_accounts(is_visible_on_map, status) WHERE is_visible_on_map = true AND status = 'active';

ALTER TABLE public.partner_deposits ENABLE ROW LEVEL SECURITY;

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_partner_deposits_updated ON public.partner_deposits;
CREATE TRIGGER trg_partner_deposits_updated
  BEFORE UPDATE ON public.partner_deposits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policies
DROP POLICY IF EXISTS "Partners view their deposits" ON public.partner_deposits;
CREATE POLICY "Partners view their deposits"
  ON public.partner_deposits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_accounts pa
      WHERE pa.id = partner_deposits.partner_id AND pa.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  );

DROP POLICY IF EXISTS "Partners create their deposits" ON public.partner_deposits;
CREATE POLICY "Partners create their deposits"
  ON public.partner_deposits FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.partner_accounts pa
      WHERE pa.id = partner_deposits.partner_id
        AND pa.user_id = auth.uid()
        AND pa.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Admins update deposits" ON public.partner_deposits;
CREATE POLICY "Admins update deposits"
  ON public.partner_deposits FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  );

-- 4) Public view (no email / no phone for non-business contact)
CREATE OR REPLACE VIEW public.partner_accounts_public
WITH (security_invoker = true)
AS
SELECT
  id,
  business_name,
  contact_phone,
  island,
  city,
  address,
  latitude,
  longitude,
  opening_hours,
  accepted_methods
FROM public.partner_accounts
WHERE status = 'active' AND is_visible_on_map = true;

GRANT SELECT ON public.partner_accounts_public TO anon, authenticated;

-- Make sure base table allows SELECT through the view: add a public-read policy restricted to visible+active
DROP POLICY IF EXISTS "Public can read visible partners" ON public.partner_accounts;
CREATE POLICY "Public can read visible partners"
  ON public.partner_accounts FOR SELECT
  TO anon, authenticated
  USING (status = 'active' AND is_visible_on_map = true);

-- 5) Update default Pro plan price + commission rate to current pricing
UPDATE public.partner_settings
SET pro_plan_price = 990,
    commission_value = 10,
    commission_type = 'percentage'
WHERE pro_plan_price = 5000;
