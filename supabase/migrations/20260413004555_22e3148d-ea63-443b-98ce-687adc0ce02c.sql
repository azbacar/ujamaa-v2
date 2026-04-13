
-- Freelancer CRM: Clients
CREATE TABLE public.freelancer_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  freelancer_id UUID NOT NULL,
  linked_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.freelancer_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "freelancer_clients_owner" ON public.freelancer_clients FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM freelancer_profiles WHERE freelancer_profiles.id = freelancer_clients.freelancer_id AND freelancer_profiles.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM freelancer_profiles WHERE freelancer_profiles.id = freelancer_clients.freelancer_id AND freelancer_profiles.user_id = auth.uid()));

CREATE POLICY "freelancer_clients_admin" ON public.freelancer_clients FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "freelancer_clients_deny_anon" ON public.freelancer_clients FOR ALL TO anon USING (false);

CREATE TRIGGER update_freelancer_clients_updated_at BEFORE UPDATE ON public.freelancer_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Freelancer CRM: Invoices
CREATE TABLE public.freelancer_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  freelancer_id UUID NOT NULL,
  client_id UUID REFERENCES public.freelancer_clients(id) ON DELETE SET NULL,
  linked_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'invoice',
  status TEXT NOT NULL DEFAULT 'draft',
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'FC',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.freelancer_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "freelancer_invoices_owner" ON public.freelancer_invoices FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM freelancer_profiles WHERE freelancer_profiles.id = freelancer_invoices.freelancer_id AND freelancer_profiles.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM freelancer_profiles WHERE freelancer_profiles.id = freelancer_invoices.freelancer_id AND freelancer_profiles.user_id = auth.uid()));

CREATE POLICY "freelancer_invoices_recipient" ON public.freelancer_invoices FOR SELECT TO authenticated
  USING (linked_user_id = auth.uid());

CREATE POLICY "freelancer_invoices_admin" ON public.freelancer_invoices FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "freelancer_invoices_deny_anon" ON public.freelancer_invoices FOR ALL TO anon USING (false);

CREATE TRIGGER update_freelancer_invoices_updated_at BEFORE UPDATE ON public.freelancer_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Freelancer CRM: Transactions
CREATE TABLE public.freelancer_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  freelancer_id UUID NOT NULL,
  invoice_id UUID REFERENCES public.freelancer_invoices(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'income',
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'FC',
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.freelancer_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "freelancer_transactions_owner" ON public.freelancer_transactions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM freelancer_profiles WHERE freelancer_profiles.id = freelancer_transactions.freelancer_id AND freelancer_profiles.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM freelancer_profiles WHERE freelancer_profiles.id = freelancer_transactions.freelancer_id AND freelancer_profiles.user_id = auth.uid()));

CREATE POLICY "freelancer_transactions_admin" ON public.freelancer_transactions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "freelancer_transactions_deny_anon" ON public.freelancer_transactions FOR ALL TO anon USING (false);

CREATE TRIGGER update_freelancer_transactions_updated_at BEFORE UPDATE ON public.freelancer_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notification trigger: notify user when they receive a freelancer invoice
CREATE OR REPLACE FUNCTION public.notify_freelancer_invoice()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.linked_user_id IS NOT NULL AND NEW.status != 'draft' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.linked_user_id,
      '📄 Nouvelle facture reçue',
      'Vous avez reçu une facture n°' || NEW.invoice_number || ' d''un montant de ' || NEW.total || ' ' || NEW.currency,
      'info',
      '/profil'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_on_freelancer_invoice
  AFTER INSERT OR UPDATE ON public.freelancer_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_freelancer_invoice();
