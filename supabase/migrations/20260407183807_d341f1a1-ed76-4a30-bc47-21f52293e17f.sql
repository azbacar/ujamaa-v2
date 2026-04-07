-- Price alerts: Pro users can subscribe to alerts on specific products/categories
CREATE TABLE public.price_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product text,
  category text,
  island text,
  threshold_type text NOT NULL DEFAULT 'any' CHECK (threshold_type IN ('any', 'above', 'below')),
  threshold_value numeric,
  is_active boolean NOT NULL DEFAULT true,
  last_triggered_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own price alerts" ON public.price_alerts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "price_alerts_deny_anon" ON public.price_alerts
  FOR ALL TO anon USING (false);

-- Price history: track price changes over time
CREATE TABLE public.price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price_id uuid NOT NULL REFERENCES public.prices(id) ON DELETE CASCADE,
  old_price numeric NOT NULL,
  new_price numeric NOT NULL,
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  changed_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view price history" ON public.price_history
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated can insert price history" ON public.price_history
  FOR INSERT TO authenticated WITH CHECK (changed_by = auth.uid());

CREATE INDEX idx_price_history_price_id ON public.price_history(price_id);
CREATE INDEX idx_price_alerts_user ON public.price_alerts(user_id, is_active);

-- Trigger to auto-record price history on update
CREATE OR REPLACE FUNCTION public.record_price_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    INSERT INTO public.price_history (price_id, old_price, new_price, changed_by)
    VALUES (NEW.id, OLD.price, NEW.price, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_record_price_change
  BEFORE UPDATE ON public.prices
  FOR EACH ROW
  EXECUTE FUNCTION public.record_price_change();