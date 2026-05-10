
-- =========================================================================
-- 1. PARTNER ACCOUNTS — fix self-update bypass + restrict public exposure
-- =========================================================================

DROP POLICY IF EXISTS "Partners update own contact info" ON public.partner_accounts;

CREATE POLICY "Partners update own contact info"
ON public.partner_accounts
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.partner_protect_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.kyc_status IS DISTINCT FROM OLD.kyc_status
     OR NEW.kyc_rejection_reason IS DISTINCT FROM OLD.kyc_rejection_reason
     OR NEW.kyc_reviewed_at IS DISTINCT FROM OLD.kyc_reviewed_at
     OR NEW.kyc_reviewed_by IS DISTINCT FROM OLD.kyc_reviewed_by
     OR NEW.notes IS DISTINCT FROM OLD.notes THEN
    RAISE EXCEPTION 'Only admins can modify status/KYC/notes fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS partner_protect_admin_fields_trg ON public.partner_accounts;
CREATE TRIGGER partner_protect_admin_fields_trg
BEFORE UPDATE ON public.partner_accounts
FOR EACH ROW EXECUTE FUNCTION public.partner_protect_admin_fields();

DROP POLICY IF EXISTS "Public can read visible partners" ON public.partner_accounts;

CREATE OR REPLACE VIEW public.partner_accounts_public
WITH (security_invoker = true) AS
SELECT
  id, business_name, address, city, island,
  latitude, longitude, opening_hours,
  accepted_methods, is_visible_on_map, status, created_at
FROM public.partner_accounts
WHERE status = 'active' AND is_visible_on_map = true;

GRANT SELECT ON public.partner_accounts_public TO anon, authenticated;

REVOKE SELECT (contact_name, contact_phone, contact_email,
               kyc_rejection_reason, kyc_reviewed_by, kyc_reviewed_at, notes)
ON public.partner_accounts FROM anon;

CREATE POLICY "Public can read active partner safe columns"
ON public.partner_accounts
FOR SELECT
TO anon, authenticated
USING (status = 'active' AND is_visible_on_map = true);


-- =========================================================================
-- 2. SITE SETTINGS — restrict full read, expose safe public view
-- =========================================================================

DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;

CREATE POLICY "Authenticated can read site settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (true);

CREATE OR REPLACE VIEW public.site_settings_public AS
SELECT
  id,
  site_name, site_logo_url, site_favicon_url,
  hero_title, hero_subtitle, hero_image_url,
  og_title, og_description, og_image_url,
  twitter_card, twitter_site, seo_keywords,
  ai_assistant_name, ai_assistant_welcome_message, ai_assistant_enabled,
  island_images,
  ga_tracking_id
FROM public.site_settings;

GRANT SELECT ON public.site_settings_public TO anon, authenticated;


-- =========================================================================
-- 3. PROMO CODES — remove broad read, add validate function
-- =========================================================================

DROP POLICY IF EXISTS promo_codes_read_active ON public.promo_codes;

CREATE OR REPLACE FUNCTION public.validate_promo_code(_code text, _plan text)
RETURNS TABLE(valid boolean, message text, discount_type text, discount_value numeric, code text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.promo_codes%ROWTYPE;
BEGIN
  SELECT * INTO rec FROM public.promo_codes
  WHERE upper(promo_codes.code) = upper(_code)
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Code promo invalide ou expiré'::text, NULL::text, NULL::numeric, NULL::text;
    RETURN;
  END IF;

  IF rec.valid_until IS NOT NULL AND rec.valid_until < now() THEN
    RETURN QUERY SELECT false, 'Ce code promo a expiré'::text, NULL::text, NULL::numeric, NULL::text;
    RETURN;
  END IF;

  IF rec.max_uses IS NOT NULL AND rec.current_uses >= rec.max_uses THEN
    RETURN QUERY SELECT false, 'Code promo épuisé'::text, NULL::text, NULL::numeric, NULL::text;
    RETURN;
  END IF;

  IF NOT (_plan = ANY(rec.applicable_plans)) THEN
    RETURN QUERY SELECT false, 'Ce code ne s''applique pas à ce plan'::text, NULL::text, NULL::numeric, NULL::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'OK'::text, rec.discount_type, rec.discount_value, rec.code;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_promo_code(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.increment_promo_code_usage(_code text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.promo_codes
  SET current_uses = current_uses + 1
  WHERE upper(code) = upper(_code) AND is_active = true;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_promo_code_usage(text) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_promo_code_usage(text) TO authenticated;


-- =========================================================================
-- 4. CHAT ATTACHMENTS STORAGE — restrict read to sender/receiver/uploader
-- =========================================================================

DROP POLICY IF EXISTS chat_attach_read ON storage.objects;

CREATE POLICY chat_attach_read
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1
      FROM public.chat_attachments ca
      JOIN public.direct_messages dm ON dm.id = ca.message_id
      WHERE ca.file_url LIKE '%' || storage.objects.name
        AND (dm.sender_id = auth.uid() OR dm.receiver_id = auth.uid())
    )
  )
);


-- =========================================================================
-- 5. API KEYS — owner can read its own metadata
-- =========================================================================

CREATE POLICY api_keys_owner_read
ON public.api_keys
FOR SELECT
TO authenticated
USING (created_by = auth.uid());


-- =========================================================================
-- 6. GASTRONOMY / CONTENT ITEMS — block anonymous contact harvesting
-- =========================================================================

REVOKE SELECT (contact_phone, contact_email, contact_whatsapp)
ON public.gastronomy_items FROM anon;

REVOKE SELECT (contact_phone, contact_whatsapp)
ON public.content_items FROM anon;
