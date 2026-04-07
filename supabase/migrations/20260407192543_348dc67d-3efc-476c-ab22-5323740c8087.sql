
-- Enterprise CRM: Clients
CREATE TABLE public.enterprise_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enterprise_id UUID NOT NULL REFERENCES public.enterprise_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.enterprise_clients ENABLE ROW LEVEL SECURITY;

-- Enterprise CRM: Invoices
CREATE TABLE public.enterprise_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enterprise_id UUID NOT NULL REFERENCES public.enterprise_profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.enterprise_clients(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'invoice', -- invoice, quote, credit_note
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'FC',
  notes TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.enterprise_invoices ENABLE ROW LEVEL SECURITY;

-- Enterprise CRM: Transactions (accounting)
CREATE TABLE public.enterprise_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enterprise_id UUID NOT NULL REFERENCES public.enterprise_profiles(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.enterprise_invoices(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'income', -- income, expense
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

ALTER TABLE public.enterprise_transactions ENABLE ROW LEVEL SECURITY;

-- RLS: enterprise_clients
CREATE POLICY "enterprise_clients_owner" ON public.enterprise_clients FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM enterprise_profiles WHERE id = enterprise_clients.enterprise_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM enterprise_profiles WHERE id = enterprise_clients.enterprise_id AND user_id = auth.uid()));

CREATE POLICY "enterprise_clients_members" ON public.enterprise_clients FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM enterprise_members WHERE enterprise_id = enterprise_clients.enterprise_id AND user_id = auth.uid()));

CREATE POLICY "enterprise_clients_admin" ON public.enterprise_clients FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "enterprise_clients_deny_anon" ON public.enterprise_clients FOR ALL TO anon USING (false);

-- RLS: enterprise_invoices
CREATE POLICY "enterprise_invoices_owner" ON public.enterprise_invoices FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM enterprise_profiles WHERE id = enterprise_invoices.enterprise_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM enterprise_profiles WHERE id = enterprise_invoices.enterprise_id AND user_id = auth.uid()));

CREATE POLICY "enterprise_invoices_members" ON public.enterprise_invoices FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM enterprise_members WHERE enterprise_id = enterprise_invoices.enterprise_id AND user_id = auth.uid()));

CREATE POLICY "enterprise_invoices_admin" ON public.enterprise_invoices FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "enterprise_invoices_deny_anon" ON public.enterprise_invoices FOR ALL TO anon USING (false);

-- RLS: enterprise_transactions
CREATE POLICY "enterprise_transactions_owner" ON public.enterprise_transactions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM enterprise_profiles WHERE id = enterprise_transactions.enterprise_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM enterprise_profiles WHERE id = enterprise_transactions.enterprise_id AND user_id = auth.uid()));

CREATE POLICY "enterprise_transactions_members" ON public.enterprise_transactions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM enterprise_members WHERE enterprise_id = enterprise_transactions.enterprise_id AND user_id = auth.uid()));

CREATE POLICY "enterprise_transactions_admin" ON public.enterprise_transactions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "enterprise_transactions_deny_anon" ON public.enterprise_transactions FOR ALL TO anon USING (false);

-- Updated_at triggers
CREATE TRIGGER update_enterprise_clients_updated_at BEFORE UPDATE ON public.enterprise_clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enterprise_invoices_updated_at BEFORE UPDATE ON public.enterprise_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enterprise_transactions_updated_at BEFORE UPDATE ON public.enterprise_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
