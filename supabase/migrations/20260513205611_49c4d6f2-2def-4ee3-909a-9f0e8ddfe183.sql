
CREATE OR REPLACE FUNCTION public.notify_tender_submission_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tender_title text;
  v_title text;
  v_msg text;
  v_type text;
  v_label text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.submitter_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT title INTO v_tender_title FROM public.content_items WHERE id = NEW.tender_id;

  v_label := CASE NEW.status
    WHEN 'under_review' THEN 'en cours d''analyse'
    WHEN 'shortlisted' THEN 'pré-sélectionnée'
    WHEN 'accepted' THEN 'retenue'
    WHEN 'rejected' THEN 'rejetée'
    WHEN 'withdrawn' THEN 'retirée'
    ELSE NEW.status
  END;

  v_type := CASE NEW.status
    WHEN 'accepted' THEN 'success'
    WHEN 'shortlisted' THEN 'success'
    WHEN 'rejected' THEN 'error'
    WHEN 'under_review' THEN 'info'
    ELSE 'info'
  END;

  v_title := CASE NEW.status
    WHEN 'accepted' THEN '🎉 Votre offre a été retenue'
    WHEN 'shortlisted' THEN '✅ Votre offre est pré-sélectionnée'
    WHEN 'rejected' THEN '❌ Votre offre n''a pas été retenue'
    WHEN 'under_review' THEN '🔍 Votre offre est en analyse'
    ELSE 'Mise à jour de votre soumission'
  END;

  v_msg := 'Statut mis à jour : ' || v_label || ' — appel d''offres « ' || COALESCE(v_tender_title, '') || ' ».';

  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    NEW.submitter_user_id,
    v_title,
    v_msg,
    v_type,
    '/appels-offres/' || NEW.tender_id::text
  );

  -- Push notification
  PERFORM net.http_post(
    url := 'https://vpibvgdpeiicczelbynf.supabase.co/functions/v1/send-push',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwaWJ2Z2RwZWlpY2N6ZWxieW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTQ2NDAsImV4cCI6MjA2Nzc5MDY0MH0.BMSjW20JV-khx-_JOHAIsonKci5pqXnt2cr8p_HWIwk"}'::jsonb,
    body := jsonb_build_object(
      'user_id', NEW.submitter_user_id,
      'title', v_title,
      'body', v_msg,
      'url', '/appels-offres/' || NEW.tender_id::text
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_tender_submission_status_change ON public.tender_submissions;
CREATE TRIGGER trg_notify_tender_submission_status_change
AFTER UPDATE OF status ON public.tender_submissions
FOR EACH ROW
EXECUTE FUNCTION public.notify_tender_submission_status_change();
