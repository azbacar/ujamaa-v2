
-- 1) KYC fields on partner_accounts
ALTER TABLE public.partner_accounts
  ADD COLUMN IF NOT EXISTS kyc_status text NOT NULL DEFAULT 'pending'
    CHECK (kyc_status IN ('pending','submitted','approved','rejected')),
  ADD COLUMN IF NOT EXISTS kyc_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS kyc_reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS kyc_rejection_reason text;

-- 2) KYC documents table
CREATE TABLE IF NOT EXISTS public.partner_kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partner_accounts(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('id_card','passport','business_license','tax_certificate','other')),
  file_path text NOT NULL,
  file_name text NOT NULL,
  notes text,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_kyc_partner ON public.partner_kyc_documents(partner_id);

ALTER TABLE public.partner_kyc_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partners view own KYC docs" ON public.partner_kyc_documents;
CREATE POLICY "Partners view own KYC docs"
  ON public.partner_kyc_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.partner_accounts pa WHERE pa.id = partner_kyc_documents.partner_id AND pa.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  );

DROP POLICY IF EXISTS "Partners upload own KYC docs" ON public.partner_kyc_documents;
CREATE POLICY "Partners upload own KYC docs"
  ON public.partner_kyc_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.partner_accounts pa WHERE pa.id = partner_kyc_documents.partner_id AND pa.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Partners delete own KYC docs before approval" ON public.partner_kyc_documents;
CREATE POLICY "Partners delete own KYC docs before approval"
  ON public.partner_kyc_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_accounts pa
      WHERE pa.id = partner_kyc_documents.partner_id
        AND pa.user_id = auth.uid()
        AND pa.kyc_status IN ('pending','submitted','rejected')
    )
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 3) BLOCK deposits unless KYC approved (replace insert policy)
DROP POLICY IF EXISTS "Partners create their deposits" ON public.partner_deposits;
CREATE POLICY "Partners create their deposits when KYC approved"
  ON public.partner_deposits FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.partner_accounts pa
      WHERE pa.id = partner_deposits.partner_id
        AND pa.user_id = auth.uid()
        AND pa.status = 'active'
        AND pa.kyc_status = 'approved'
    )
  );

-- 4) Storage policies for partner-kyc/ prefix in verification-documents bucket
-- Path layout: verification-documents/partner-kyc/{partner_id}/filename
DROP POLICY IF EXISTS "Partners upload own KYC files" ON storage.objects;
CREATE POLICY "Partners upload own KYC files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'verification-documents'
    AND (storage.foldername(name))[1] = 'partner-kyc'
    AND EXISTS (
      SELECT 1 FROM public.partner_accounts pa
      WHERE pa.id::text = (storage.foldername(name))[2]
        AND pa.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Partners read own KYC files" ON storage.objects;
CREATE POLICY "Partners read own KYC files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'verification-documents'
    AND (storage.foldername(name))[1] = 'partner-kyc'
    AND (
      EXISTS (
        SELECT 1 FROM public.partner_accounts pa
        WHERE pa.id::text = (storage.foldername(name))[2]
          AND pa.user_id = auth.uid()
      )
      OR public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'moderator'::app_role)
    )
  );

DROP POLICY IF EXISTS "Partners delete own KYC files" ON storage.objects;
CREATE POLICY "Partners delete own KYC files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'verification-documents'
    AND (storage.foldername(name))[1] = 'partner-kyc'
    AND EXISTS (
      SELECT 1 FROM public.partner_accounts pa
      WHERE pa.id::text = (storage.foldername(name))[2]
        AND pa.user_id = auth.uid()
        AND pa.kyc_status IN ('pending','submitted','rejected')
    )
  );

-- 5) Trigger: when admin sets kyc_status, capture reviewer + timestamp
CREATE OR REPLACE FUNCTION public.set_partner_kyc_review_meta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.kyc_status IS DISTINCT FROM OLD.kyc_status
     AND NEW.kyc_status IN ('approved','rejected') THEN
    NEW.kyc_reviewed_at := now();
    NEW.kyc_reviewed_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_partner_kyc_review_meta ON public.partner_accounts;
CREATE TRIGGER trg_partner_kyc_review_meta
  BEFORE UPDATE ON public.partner_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_partner_kyc_review_meta();

-- 6) Notify partner when KYC reviewed
CREATE OR REPLACE FUNCTION public.notify_partner_kyc_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.kyc_status IS DISTINCT FROM OLD.kyc_status
     AND NEW.kyc_status IN ('approved','rejected') THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      CASE WHEN NEW.kyc_status = 'approved' THEN '✅ KYC concessionnaire approuvé' ELSE '❌ KYC concessionnaire rejeté' END,
      CASE WHEN NEW.kyc_status = 'approved'
        THEN 'Votre dossier a été approuvé. Vous pouvez désormais collecter et reverser les abonnements à AZZHY.'
        ELSE COALESCE('Motif : ' || NEW.kyc_rejection_reason, 'Veuillez consulter votre espace concessionnaire pour plus de détails.')
      END,
      CASE WHEN NEW.kyc_status = 'approved' THEN 'success' ELSE 'error' END,
      '/partener'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_partner_kyc_review ON public.partner_accounts;
CREATE TRIGGER trg_notify_partner_kyc_review
  AFTER UPDATE ON public.partner_accounts
  FOR EACH ROW EXECUTE FUNCTION public.notify_partner_kyc_review();
