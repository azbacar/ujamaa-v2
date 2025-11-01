-- Drop triggers first, then recreate functions with proper search_path
DROP TRIGGER IF EXISTS generate_ticket_code_trigger ON public.event_registrations;
DROP TRIGGER IF EXISTS update_registered_count_trigger ON public.event_registrations;

DROP FUNCTION IF EXISTS generate_ticket_code();
DROP FUNCTION IF EXISTS set_ticket_code();
DROP FUNCTION IF EXISTS update_event_registered_count();

-- Recreate with proper search_path
CREATE OR REPLACE FUNCTION generate_ticket_code()
RETURNS TEXT 
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := 'TKT-' || upper(substr(md5(random()::text), 1, 8));
    SELECT EXISTS(SELECT 1 FROM public.event_registrations WHERE ticket_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$;

CREATE OR REPLACE FUNCTION set_ticket_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_code IS NULL THEN
    NEW.ticket_code := generate_ticket_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_event_registered_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.events 
    SET registered_count = registered_count + 1 
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.events 
    SET registered_count = GREATEST(0, registered_count - 1)
    WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Recreate triggers
CREATE TRIGGER generate_ticket_code_trigger
  BEFORE INSERT ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_code();

CREATE TRIGGER update_registered_count_trigger
  AFTER INSERT OR DELETE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_event_registered_count();