
-- 1) OHADA fields on content_items (nullable — only used when type='tender')
ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS reference_number text,
  ADD COLUMN IF NOT EXISTS procurement_type text,
  ADD COLUMN IF NOT EXISTS contracting_authority text,
  ADD COLUMN IF NOT EXISTS lots_count integer,
  ADD COLUMN IF NOT EXISTS budget_estimate numeric,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'KMF',
  ADD COLUMN IF NOT EXISTS guarantee_amount numeric,
  ADD COLUMN IF NOT EXISTS deadline_at timestamptz,
  ADD COLUMN IF NOT EXISTS opening_at timestamptz,
  ADD COLUMN IF NOT EXISTS opening_location text,
  ADD COLUMN IF NOT EXISTS submission_location text,
  ADD COLUMN IF NOT EXISTS island text,
  ADD COLUMN IF NOT EXISTS required_documents jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS evaluation_criteria jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_content_items_tender_deadline
  ON public.content_items (deadline_at)
  WHERE type = 'tender';

-- 2) Extend tender_submissions to allow non-enterprise submissions
ALTER TABLE public.tender_submissions
  ALTER COLUMN enterprise_id DROP NOT NULL;

ALTER TABLE public.tender_submissions
  ADD COLUMN IF NOT EXISTS submitter_user_id uuid,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS company_type text,
  ADD COLUMN IF NOT EXISTS registration_number text,
  ADD COLUMN IF NOT EXISTS tax_number text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS island text,
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS contact_title text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS delivery_time text,
  ADD COLUMN IF NOT EXISTS technical_approach text,
  ADD COLUMN IF NOT EXISTS team_description text,
  ADD COLUMN IF NOT EXISTS acknowledged_terms boolean DEFAULT false;

ALTER TABLE public.tender_submissions
  ADD CONSTRAINT tender_submissions_has_owner
  CHECK (submitter_user_id IS NOT NULL OR enterprise_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_tender_submissions_tender ON public.tender_submissions(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_submissions_submitter ON public.tender_submissions(submitter_user_id);

-- 3) RLS: allow any authenticated user to submit + read own
DROP POLICY IF EXISTS "Authenticated users can create submissions" ON public.tender_submissions;
CREATE POLICY "Authenticated users can create submissions"
  ON public.tender_submissions FOR INSERT TO authenticated
  WITH CHECK (
    submitter_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.content_items
      WHERE id = tender_id AND type = 'tender' AND status = 'published'
    )
  );

DROP POLICY IF EXISTS "Submitters can view own submissions" ON public.tender_submissions;
CREATE POLICY "Submitters can view own submissions"
  ON public.tender_submissions FOR SELECT TO authenticated
  USING (submitter_user_id = auth.uid());

DROP POLICY IF EXISTS "Submitters can update own pending submissions" ON public.tender_submissions;
CREATE POLICY "Submitters can update own pending submissions"
  ON public.tender_submissions FOR UPDATE TO authenticated
  USING (submitter_user_id = auth.uid() AND status = 'pending')
  WITH CHECK (submitter_user_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "Submitters can delete own pending submissions" ON public.tender_submissions;
CREATE POLICY "Submitters can delete own pending submissions"
  ON public.tender_submissions FOR DELETE TO authenticated
  USING (submitter_user_id = auth.uid() AND status = 'pending');

-- 4) Public aggregate count function (no PII leak)
CREATE OR REPLACE FUNCTION public.get_tender_submission_count(_tender_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.tender_submissions WHERE tender_id = _tender_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_tender_submission_count(uuid) TO anon, authenticated;

-- 5) Notify tender author on new submission (in-app + edge fn for email/WhatsApp)
CREATE OR REPLACE FUNCTION public.notify_tender_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_id uuid;
  v_tender_title text;
  v_author_email text;
  v_author_phone text;
  v_count integer;
BEGIN
  SELECT ci.author_id, ci.title INTO v_author_id, v_tender_title
  FROM public.content_items ci WHERE ci.id = NEW.tender_id;

  IF v_author_id IS NULL THEN RETURN NEW; END IF;

  SELECT count(*) INTO v_count FROM public.tender_submissions WHERE tender_id = NEW.tender_id;

  -- In-app notification to author
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    v_author_id,
    '📬 Nouvelle soumission reçue',
    COALESCE(NEW.company_name, 'Un soumissionnaire') || ' a soumis une offre pour « ' || v_tender_title || ' » (' || v_count || ' offre(s) au total)',
    'info',
    '/appels-offres/' || NEW.tender_id::text
  );

  -- Acknowledgement notification to submitter
  IF NEW.submitter_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.submitter_user_id,
      '✅ Soumission enregistrée',
      'Votre offre pour « ' || v_tender_title || ' » a bien été enregistrée. Vous serez notifié de la décision.',
      'success',
      '/appels-offres/' || NEW.tender_id::text
    );
  END IF;

  -- Edge function for email + WhatsApp to author
  SELECT email INTO v_author_email FROM public.users WHERE id = v_author_id;
  SELECT contact_phone INTO v_author_phone FROM public.content_items WHERE id = NEW.tender_id;

  PERFORM net.http_post(
    url := 'https://vpibvgdpeiicczelbynf.supabase.co/functions/v1/notify-tender-submission',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwaWJ2Z2RwZWlpY2N6ZWxieW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTQ2NDAsImV4cCI6MjA2Nzc5MDY0MH0.BMSjW20JV-khx-_JOHAIsonKci5pqXnt2cr8p_HWIwk"}'::jsonb,
    body := jsonb_build_object(
      'author_email', v_author_email,
      'author_phone', v_author_phone,
      'tender_title', v_tender_title,
      'tender_id', NEW.tender_id,
      'company_name', NEW.company_name,
      'contact_name', NEW.contact_name,
      'proposed_amount', NEW.proposed_amount,
      'currency', NEW.currency,
      'submissions_count', v_count,
      'link', 'https://ujamaan.com/appels-offres/' || NEW.tender_id::text
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_tender_submission ON public.tender_submissions;
CREATE TRIGGER trg_notify_tender_submission
  AFTER INSERT ON public.tender_submissions
  FOR EACH ROW EXECUTE FUNCTION public.notify_tender_submission();
