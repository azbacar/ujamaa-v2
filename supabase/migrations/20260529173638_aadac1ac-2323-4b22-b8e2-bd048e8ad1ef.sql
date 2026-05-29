CREATE OR REPLACE FUNCTION public.apply_price_update_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_price_id uuid;
  v_new_price numeric;
BEGIN
  IF NEW.type = 'price_update'
     AND NEW.status = 'approved'
     AND (OLD.status IS DISTINCT FROM 'approved') THEN
    IF NEW.content IS NULL
       OR NOT (NEW.content ? 'price_id')
       OR NOT (NEW.content ? 'new_price')
       OR (NEW.content->>'price_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       OR (NEW.content->>'new_price') !~ '^\d+(\.\d+)?$' THEN
      RAISE EXCEPTION 'Données de mise à jour de prix invalides';
    END IF;

    v_price_id := (NEW.content->>'price_id')::uuid;
    v_new_price := (NEW.content->>'new_price')::numeric;

    IF v_new_price <= 0 THEN
      RAISE EXCEPTION 'Le nouveau prix doit être supérieur à zéro';
    END IF;

    UPDATE public.prices
    SET price = v_new_price,
        updated_at = now()
    WHERE id = v_price_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Prix introuvable pour cette modification';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_price_update_modification ON public.pending_modifications;
CREATE TRIGGER trg_apply_price_update_modification
AFTER UPDATE OF status ON public.pending_modifications
FOR EACH ROW
EXECUTE FUNCTION public.apply_price_update_modification();

UPDATE public.prices p
SET price = (pm.content->>'new_price')::numeric,
    updated_at = now()
FROM public.pending_modifications pm
WHERE pm.type = 'price_update'
  AND pm.status = 'approved'
  AND pm.content ? 'price_id'
  AND pm.content ? 'new_price'
  AND (pm.content->>'price_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND (pm.content->>'new_price') ~ '^\d+(\.\d+)?$'
  AND p.id = (pm.content->>'price_id')::uuid
  AND p.price IS DISTINCT FROM (pm.content->>'new_price')::numeric;