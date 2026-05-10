
ALTER TABLE public.price_alerts
  ADD COLUMN IF NOT EXISTS notify_email boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_whatsapp boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_phone text;

-- Étendre le trigger pour appeler la fonction d'envoi externe
CREATE OR REPLACE FUNCTION public.notify_price_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pct numeric;
  v_direction text;
  v_alert record;
  v_match boolean;
  v_sensitive boolean;
  v_product_lc text;
  v_user_email text;
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

      -- Email + WhatsApp via edge function
      IF v_alert.notify_email OR v_alert.notify_whatsapp THEN
        PERFORM net.http_post(
          url := 'https://vpibvgdpeiicczelbynf.supabase.co/functions/v1/send-price-alert',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwaWJ2Z2RwZWlpY2N6ZWxieW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTQ2NDAsImV4cCI6MjA2Nzc5MDY0MH0.BMSjW20JV-khx-_JOHAIsonKci5pqXnt2cr8p_HWIwk"}'::jsonb,
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
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwaWJ2Z2RwZWlpY2N6ZWxieW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTQ2NDAsImV4cCI6MjA2Nzc5MDY0MH0.BMSjW20JV-khx-_JOHAIsonKci5pqXnt2cr8p_HWIwk"}'::jsonb,
      body := jsonb_build_object(
        'title', '⛽ ' || NEW.product || ' : ' || v_direction || ' ' || abs(v_pct) || '%',
        'body', NEW.product || ' : ' || OLD.price || ' → ' || NEW.price || ' ' || coalesce(NEW.currency,'KMF'),
        'url', '/prix?focus=' || NEW.id::text
      )
    );
  END IF;

  RETURN NEW;
END;
$$;
