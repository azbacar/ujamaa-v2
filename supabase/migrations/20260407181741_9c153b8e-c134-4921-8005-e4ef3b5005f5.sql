-- Add merchant_type and geo_expires_at to prices table
ALTER TABLE public.prices
  ADD COLUMN IF NOT EXISTS merchant_type text NOT NULL DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS geo_expires_at timestamp with time zone;

-- Create index for filtering active geo prices
CREATE INDEX IF NOT EXISTS idx_prices_merchant_geo ON public.prices (merchant_type, geo_expires_at)
  WHERE latitude IS NOT NULL;