
-- 1. Activer les catégories Transport & Bricolage avec leurs liens
UPDATE public.homepage_categories
SET link = '/infos-pratiques', description = COALESCE(description, 'Tarifs taxis, location véhicules et transport inter-îles')
WHERE title = 'Transport';

UPDATE public.homepage_categories
SET link = '/annonces?category=Bricolage'
WHERE title = 'Bricolage et Maintenance';

-- 2. Nouveau trigger de notification sur changement de prix
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

  -- 2a. Alertes utilisateurs ciblées
  FOR v_alert IN
    SELECT * FROM public.price_alerts WHERE is_active = true
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
    END IF;
  END LOOP;

  -- 2b. Produits sensibles : push global
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

DROP TRIGGER IF EXISTS trg_notify_price_change ON public.prices;
CREATE TRIGGER trg_notify_price_change
AFTER UPDATE OF price ON public.prices
FOR EACH ROW EXECUTE FUNCTION public.notify_price_change();
