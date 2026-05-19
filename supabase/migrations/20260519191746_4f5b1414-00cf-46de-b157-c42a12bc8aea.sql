
-- 1) FREELANCER WHATSAPP: revoke direct column access; RPC get_freelancer_whatsapp() is the only path
REVOKE SELECT (whatsapp) ON public.freelancer_profiles FROM anon, authenticated;

-- 2) PARTNER_SETTINGS: restrict to admins and active partners only
DROP POLICY IF EXISTS "Anyone authenticated can read partner settings" ON public.partner_settings;
CREATE POLICY "Admins and partners can read partner settings"
ON public.partner_settings
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_active_partner(auth.uid())
);

-- 3) PRICE_HISTORY: restrict to admins/moderators and the user who triggered the change
DROP POLICY IF EXISTS "Authenticated can view price history" ON public.price_history;
CREATE POLICY "Admins moderators and owners can view price history"
ON public.price_history
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'moderator'::app_role)
  OR changed_by = auth.uid()
);
