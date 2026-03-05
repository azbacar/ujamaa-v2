
CREATE TABLE public.pro_subscription_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'premium',
  payment_method text NOT NULL,
  payment_reference text,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'FC',
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  review_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pro_subscription_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own requests" ON public.pro_subscription_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can view own requests" ON public.pro_subscription_requests FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins and moderators can view all" ON public.pro_subscription_requests FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Admins and moderators can update" ON public.pro_subscription_requests FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));
