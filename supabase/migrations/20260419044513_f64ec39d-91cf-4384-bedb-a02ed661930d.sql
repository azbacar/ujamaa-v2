-- 1. Ajouter le rôle 'partner' à l'enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'partner';

-- 2. Table partner_accounts
CREATE TABLE public.partner_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  business_name text NOT NULL,
  contact_name text,
  contact_phone text,
  contact_email text,
  island text,
  city text,
  address text,
  status text NOT NULL DEFAULT 'active', -- active, suspended
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_partner_accounts_user ON public.partner_accounts (user_id);
CREATE INDEX idx_partner_accounts_status ON public.partner_accounts (status);

ALTER TABLE public.partner_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage partner accounts"
ON public.partner_accounts FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partners view own account"
ON public.partner_accounts FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Partners update own contact info"
ON public.partner_accounts FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND status = (SELECT status FROM public.partner_accounts WHERE id = partner_accounts.id));

CREATE POLICY "partner_accounts_deny_anon"
ON public.partner_accounts FOR ALL TO anon USING (false);

-- 3. Table partner_settings (singleton — config globale)
CREATE TABLE public.partner_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_type text NOT NULL DEFAULT 'percentage', -- 'percentage' ou 'fixed'
  commission_value numeric NOT NULL DEFAULT 10, -- 10% ou 500 FC
  currency text NOT NULL DEFAULT 'FC',
  pro_plan_price numeric NOT NULL DEFAULT 5000,
  is_active boolean NOT NULL DEFAULT true,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read partner settings"
ON public.partner_settings FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins manage partner settings"
ON public.partner_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "partner_settings_deny_anon"
ON public.partner_settings FOR ALL TO anon USING (false);

-- Insérer la configuration par défaut
INSERT INTO public.partner_settings (commission_type, commission_value, currency, pro_plan_price)
VALUES ('percentage', 10, 'FC', 5000);

-- 4. Table partner_transactions
CREATE TABLE public.partner_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partner_accounts(id) ON DELETE RESTRICT,
  client_user_id uuid NOT NULL,
  client_email text,
  client_phone text,
  plan text NOT NULL DEFAULT 'pro_monthly',
  amount_collected numeric NOT NULL,
  commission_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'FC',
  reference text,
  notes text,
  status text NOT NULL DEFAULT 'completed', -- completed, refunded, cancelled
  pro_request_id uuid, -- lien vers pro_subscription_requests
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_partner_tx_partner ON public.partner_transactions (partner_id, created_at DESC);
CREATE INDEX idx_partner_tx_client ON public.partner_transactions (client_user_id);

ALTER TABLE public.partner_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage partner transactions"
ON public.partner_transactions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partners view own transactions"
ON public.partner_transactions FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.partner_accounts pa
  WHERE pa.id = partner_transactions.partner_id AND pa.user_id = auth.uid()
));

CREATE POLICY "Partners create own transactions"
ON public.partner_transactions FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.partner_accounts pa
  WHERE pa.id = partner_transactions.partner_id
    AND pa.user_id = auth.uid()
    AND pa.status = 'active'
));

CREATE POLICY "Clients view own partner transactions"
ON public.partner_transactions FOR SELECT TO authenticated
USING (client_user_id = auth.uid());

CREATE POLICY "partner_transactions_deny_anon"
ON public.partner_transactions FOR ALL TO anon USING (false);

-- 5. Trigger updated_at sur partner_accounts
CREATE TRIGGER trg_partner_accounts_updated
BEFORE UPDATE ON public.partner_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Helper function : un user est-il un partenaire actif ?
CREATE OR REPLACE FUNCTION public.is_active_partner(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.partner_accounts
    WHERE user_id = _user_id AND status = 'active'
  );
$$;

-- 7. Trigger : quand un partenaire crée une transaction, créer aussi une pro_subscription_request approved
CREATE OR REPLACE FUNCTION public.partner_collect_to_pro_request()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_request_id uuid;
BEGIN
  IF NEW.status = 'completed' AND NEW.pro_request_id IS NULL THEN
    INSERT INTO public.pro_subscription_requests (
      user_id, plan, payment_method, payment_reference,
      amount, final_amount, currency, status, reviewed_at, reviewed_by
    ) VALUES (
      NEW.client_user_id,
      NEW.plan,
      'partner_cash',
      'PARTNER:' || NEW.id::text,
      NEW.amount_collected,
      NEW.amount_collected,
      NEW.currency,
      'approved',
      now(),
      (SELECT user_id FROM public.partner_accounts WHERE id = NEW.partner_id)
    )
    RETURNING id INTO new_request_id;
    NEW.pro_request_id := new_request_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_partner_tx_create_pro_request
BEFORE INSERT ON public.partner_transactions
FOR EACH ROW EXECUTE FUNCTION public.partner_collect_to_pro_request();