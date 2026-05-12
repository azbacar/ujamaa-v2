
-- ============================================================
-- SECURITY HARDENING — fix scanner findings
-- ============================================================

-- 1) site_settings: remove broad anon SELECT; expose via existing public view
DROP POLICY IF EXISTS "Public can read site settings rows" ON public.site_settings;
GRANT SELECT ON public.site_settings_public TO anon, authenticated;

-- 2) partner_accounts: remove broad public SELECT; expose via existing public view
DROP POLICY IF EXISTS "Public can read active partner safe columns" ON public.partner_accounts;
GRANT SELECT ON public.partner_accounts_public TO anon, authenticated;

-- 3) tender-documents bucket → private + restricted SELECT
UPDATE storage.buckets SET public = false WHERE id = 'tender-documents';
DROP POLICY IF EXISTS "Public read tender documents" ON storage.objects;
CREATE POLICY "Tender docs readable by submitter, tender author, or staff"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'tender-documents'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.content_items ci
      WHERE ci.id::text = (storage.foldername(name))[2]
        AND ci.author_id = auth.uid()
    )
  )
);

-- 4) freelancer_profiles.whatsapp: revoke column SELECT, expose via Pro-gated RPC
REVOKE SELECT (whatsapp) ON public.freelancer_profiles FROM anon;
REVOKE SELECT (whatsapp) ON public.freelancer_profiles FROM authenticated;

CREATE OR REPLACE FUNCTION public.get_freelancer_whatsapp(_profile_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_whatsapp text;
BEGIN
  SELECT user_id, whatsapp INTO v_owner, v_whatsapp
  FROM public.freelancer_profiles WHERE id = _profile_id;

  IF v_whatsapp IS NULL OR v_owner IS NULL THEN
    RETURN NULL;
  END IF;

  -- Owner always sees their own
  IF auth.uid() = v_owner THEN RETURN v_whatsapp; END IF;

  -- Staff
  IF public.has_role(auth.uid(), 'admin'::app_role)
     OR public.has_role(auth.uid(), 'moderator'::app_role) THEN
    RETURN v_whatsapp;
  END IF;

  -- Pro viewer OR Pro author can reveal contact (mirrors ContactDisplay logic)
  IF public.is_pro_user(auth.uid()) OR public.is_pro_user(v_owner) THEN
    RETURN v_whatsapp;
  END IF;

  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_freelancer_whatsapp(uuid) TO authenticated, anon;

-- 5) investments: revoke contact_phone / contact_email from anon
REVOKE SELECT (contact_phone, contact_email) ON public.investments FROM anon;
