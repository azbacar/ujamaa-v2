
-- ============================================================
-- 1. COLUMN-LEVEL REVOKES FOR PII ON PUBLIC TABLES
-- ============================================================

-- content_items: hide contact_phone, contact_whatsapp from anon
REVOKE SELECT ON public.content_items FROM anon;
GRANT SELECT (
  id, type, title, description, category, status, author_id, published_at,
  views, created_at, updated_at, reference_number, procurement_type,
  contracting_authority, lots_count, budget_estimate, currency,
  guarantee_amount, deadline_at, opening_at, opening_location,
  submission_location, island, required_documents, evaluation_criteria,
  attachments
) ON public.content_items TO anon;

-- events: hide contact_phone, contact_email from anon
REVOKE SELECT ON public.events FROM anon;
GRANT SELECT (
  id, title, description, full_content, category, date, end_date, location,
  island, organizer, images, price, currency, capacity, registered_count,
  status, requires_registration, requires_payment, author_id,
  created_at, updated_at, views, metadata
) ON public.events TO anon;

-- freelancer_profiles: hide whatsapp from anon AND authenticated
-- (already denied to anon by RLS, but column-level grant ensures even
--  service-role-mediated public selects with explicit cols cannot leak it
--  inadvertently; RPC get_freelancer_whatsapp remains the only reveal path)
REVOKE SELECT ON public.freelancer_profiles FROM authenticated;
GRANT SELECT (
  id, user_id, display_name, bio, skills, hourly_rate_min, hourly_rate_max,
  currency, experience_years, portfolio_url, island, location, is_available,
  is_visible, views, created_at, updated_at, avatar_url,
  facebook_url, linkedin_url, twitter_url, instagram_url
) ON public.freelancer_profiles TO authenticated;

REVOKE SELECT ON public.freelancer_profiles FROM anon;
GRANT SELECT (
  id, user_id, display_name, bio, skills, hourly_rate_min, hourly_rate_max,
  currency, experience_years, portfolio_url, island, location, is_available,
  is_visible, views, created_at, updated_at, avatar_url,
  facebook_url, linkedin_url, twitter_url, instagram_url
) ON public.freelancer_profiles TO anon;

-- gastronomy_items: hide contact_* from authenticated (anon already restricted)
REVOKE SELECT ON public.gastronomy_items FROM authenticated;
GRANT SELECT (
  id, author_id, type, title, description, price_min, price_max,
  images, location, category, views, created_at, updated_at, status,
  latitude, longitude, geo_expires_at, dining_style, accommodation_type,
  service_mode, room_types, metadata
) ON public.gastronomy_items TO authenticated;

-- ============================================================
-- 2. INTERNAL SECRET FOR NOTIFICATION EDGE FUNCTIONS
--    Update trigger functions to pass x-internal-secret header.
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_event_published()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if NEW.status = 'published' and (TG_OP = 'INSERT' or OLD.status is distinct from 'published') then
    insert into public.notifications (title, message, type, link)
    values (
      '🎉 Nouvel événement',
      NEW.title,
      'info',
      '/evenements/' || NEW.id::text
    );

    perform net.http_post(
      url := 'https://vpibvgdpeiicczelbynf.supabase.co/functions/v1/notify-broadcast',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', 'b8b0b865cc4db94ea7fa74dbff3787b9885acee0a71de585966382615525697e'
      ),
      body := jsonb_build_object(
        'title', '🎉 Nouvel événement : ' || NEW.title,
        'body', coalesce(NEW.description, NEW.title),
        'url', '/evenements/' || NEW.id::text
      )
    );
  end if;
  return NEW;
end;
$function$;

CREATE OR REPLACE FUNCTION public.notify_urgent_announcement()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if NEW.type = 'urgent' then
    insert into public.notifications (title, message, type, link)
    values (
      '🚨 Alerte urgente',
      NEW.title || ' - ' || NEW.content,
      'error',
      '/'
    );

    perform net.http_post(
      url := 'https://vpibvgdpeiicczelbynf.supabase.co/functions/v1/notify-broadcast',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', 'b8b0b865cc4db94ea7fa74dbff3787b9885acee0a71de585966382615525697e'
      ),
      body := jsonb_build_object(
        'title', '🚨 ' || NEW.title,
        'body', NEW.content,
        'url', '/'
      )
    );
  end if;
  return NEW;
end;
$function$;

CREATE OR REPLACE FUNCTION public.notify_price_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pct numeric;
  v_direction text;
  v_alert record;
  v_match boolean;
  v_sensitive boolean;
  v_product_lc text;
  v_user_email text;
  v_internal_secret text := 'b8b0b865cc4db94ea7fa74dbff3787b9885acee0a71de585966382615525697e';
BEGIN
  IF NEW.status IS DISTINCT FROM 'published' OR OLD.price IS NOT DISTINCT FROM NEW.price THEN
    RETURN NEW;
  END IF;

  v_pct := CASE WHEN OLD.price > 0
                THEN round(((NEW.price - OLD.price) / OLD.price) * 100, 1)
                ELSE 0 END;
  v_direction := CASE WHEN NEW.price > OLD.price THEN '📈 hausse' ELSE '📉 baisse' END;
  v_product_lc := lower(coalesce(NEW.product, ''));
  v_sensitive := v_product_lc ~ '(carburant|essence|gasoil|diesel|gaz|riz|ciment|sucre|farine)';

  FOR v_alert IN
    SELECT pa.*, u.email AS user_email
    FROM public.price_alerts pa
    LEFT JOIN public.users u ON u.id = pa.user_id
    WHERE pa.is_active = true
  LOOP
    v_match := true;
    IF v_alert.product IS NOT NULL AND v_alert.product <> '' THEN
      v_match := v_match AND lower(v_alert.product) = lower(NEW.product);
    END IF;
    IF v_alert.category IS NOT NULL AND v_alert.category <> '' THEN
      v_match := v_match AND lower(v_alert.category) = lower(NEW.category);
    END IF;
    IF v_alert.island IS NOT NULL AND v_alert.island <> '' THEN
      v_match := v_match AND lower(v_alert.island) = lower(coalesce(NEW.island,''));
    END IF;
    IF v_alert.threshold_type = 'increase' AND NEW.price <= OLD.price THEN v_match := false; END IF;
    IF v_alert.threshold_type = 'decrease' AND NEW.price >= OLD.price THEN v_match := false; END IF;
    IF v_alert.threshold_value IS NOT NULL AND abs(v_pct) < v_alert.threshold_value THEN
      v_match := false;
    END IF;

    IF v_match THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        v_alert.user_id,
        '💰 Prix mis à jour : ' || NEW.product,
        v_direction || ' de ' || abs(v_pct) || '% — ' || NEW.product
          || ' est passé de ' || OLD.price || ' à ' || NEW.price || ' ' || coalesce(NEW.currency,'KMF')
          || coalesce(' (' || NEW.island || ')', ''),
        CASE WHEN NEW.price > OLD.price THEN 'warning' ELSE 'success' END,
        '/prix?focus=' || NEW.id::text
      );
      UPDATE public.price_alerts SET last_triggered_at = now() WHERE id = v_alert.id;

      IF v_alert.notify_email OR v_alert.notify_whatsapp THEN
        PERFORM net.http_post(
          url := 'https://vpibvgdpeiicczelbynf.supabase.co/functions/v1/send-price-alert',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-internal-secret', v_internal_secret
          ),
          body := jsonb_build_object(
            'email', CASE WHEN v_alert.notify_email THEN v_alert.user_email ELSE NULL END,
            'whatsapp', CASE WHEN v_alert.notify_whatsapp THEN v_alert.whatsapp_phone ELSE NULL END,
            'product', NEW.product,
            'old_price', OLD.price,
            'new_price', NEW.price,
            'currency', coalesce(NEW.currency,'KMF'),
            'island', NEW.island,
            'pct', v_pct,
            'direction', CASE WHEN NEW.price > OLD.price THEN 'hausse' ELSE 'baisse' END,
            'link', 'https://ujamaan.com/prix?focus=' || NEW.id::text
          )
        );
      END IF;
    END IF;
  END LOOP;

  IF v_sensitive AND abs(v_pct) >= 1 THEN
    INSERT INTO public.notifications (title, message, type, link)
    VALUES (
      '⛽ ' || NEW.product || ' : ' || v_direction || ' ' || abs(v_pct) || '%',
      NEW.product || ' est passé de ' || OLD.price || ' à ' || NEW.price || ' '
        || coalesce(NEW.currency,'KMF') || coalesce(' à ' || NEW.island, ''),
      CASE WHEN NEW.price > OLD.price THEN 'warning' ELSE 'success' END,
      '/prix?focus=' || NEW.id::text
    );

    PERFORM net.http_post(
      url := 'https://vpibvgdpeiicczelbynf.supabase.co/functions/v1/notify-broadcast',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', v_internal_secret
      ),
      body := jsonb_build_object(
        'title', '⛽ ' || NEW.product || ' : ' || v_direction || ' ' || abs(v_pct) || '%',
        'body', NEW.product || ' : ' || OLD.price || ' → ' || NEW.price || ' ' || coalesce(NEW.currency,'KMF'),
        'url', '/prix?focus=' || NEW.id::text
      )
    );
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_tender_submission()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    v_author_id,
    '📬 Nouvelle soumission reçue',
    COALESCE(NEW.company_name, 'Un soumissionnaire') || ' a soumis une offre pour « ' || v_tender_title || ' » (' || v_count || ' offre(s) au total)',
    'info',
    '/appels-offres/' || NEW.tender_id::text
  );

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

  SELECT email INTO v_author_email FROM public.users WHERE id = v_author_id;
  SELECT contact_phone INTO v_author_phone FROM public.content_items WHERE id = NEW.tender_id;

  PERFORM net.http_post(
    url := 'https://vpibvgdpeiicczelbynf.supabase.co/functions/v1/notify-tender-submission',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', 'b8b0b865cc4db94ea7fa74dbff3787b9885acee0a71de585966382615525697e'
    ),
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
$function$;

-- Also update notify_tender_submission_status_change push call
CREATE OR REPLACE FUNCTION public.notify_tender_submission_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  PERFORM net.http_post(
    url := 'https://vpibvgdpeiicczelbynf.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', 'b8b0b865cc4db94ea7fa74dbff3787b9885acee0a71de585966382615525697e'
    ),
    body := jsonb_build_object(
      'user_id', NEW.submitter_user_id,
      'title', v_title,
      'body', v_msg,
      'url', '/appels-offres/' || NEW.tender_id::text
    )
  );

  RETURN NEW;
END;
$function$;
