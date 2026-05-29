CREATE OR REPLACE FUNCTION public.record_price_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    IF NEW.price > OLD.price THEN
      NEW.trend := 'up';
    ELSIF NEW.price < OLD.price THEN
      NEW.trend := 'down';
    ELSE
      NEW.trend := 'stable';
    END IF;
    INSERT INTO public.price_history (price_id, old_price, new_price, changed_by)
    VALUES (NEW.id, OLD.price, NEW.price, auth.uid());
  END IF;
  RETURN NEW;
END;
$function$;

-- Ensure trigger runs BEFORE so NEW.trend update persists
DROP TRIGGER IF EXISTS trg_record_price_change ON public.prices;
CREATE TRIGGER trg_record_price_change
BEFORE UPDATE ON public.prices
FOR EACH ROW
EXECUTE FUNCTION public.record_price_change();

-- Backfill: recompute trend for prices that have history
UPDATE public.prices p
SET trend = CASE
  WHEN h.new_price > h.old_price THEN 'up'
  WHEN h.new_price < h.old_price THEN 'down'
  ELSE 'stable'
END
FROM (
  SELECT DISTINCT ON (price_id) price_id, old_price, new_price
  FROM public.price_history
  ORDER BY price_id, changed_at DESC
) h
WHERE p.id = h.price_id;