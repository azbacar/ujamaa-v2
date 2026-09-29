CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS public.internal_config (key text PRIMARY KEY, value text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.internal_config FROM anon, authenticated;
GRANT ALL ON public.internal_config TO service_role;
ALTER TABLE public.internal_config ENABLE ROW LEVEL SECURITY;
INSERT INTO public.internal_config(key,value) VALUES ('notify_internal_secret', encode(extensions.gen_random_bytes(32),'hex'))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

CREATE OR REPLACE FUNCTION public.get_internal_secret()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT value FROM public.internal_config WHERE key = 'notify_internal_secret'
$$;
REVOKE EXECUTE ON FUNCTION public.get_internal_secret() FROM PUBLIC, anon, authenticated;

DO $do$
DECLARE f text; src text;
BEGIN
  FOREACH f IN ARRAY ARRAY['notify_event_published','notify_price_change','notify_tender_submission','notify_tender_submission_status_change','notify_urgent_announcement'] LOOP
    SELECT pg_get_functiondef(('public.'||f||'()')::regprocedure) INTO src;
    src := replace(src, '''b8b0b865cc4db94ea7fa74dbff3787b9885acee0a71de585966382615525697e''', 'public.get_internal_secret()');
    EXECUTE src;
  END LOOP;
END $do$;

REVOKE EXECUTE ON FUNCTION public.lookup_user_id_by_email(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.lookup_user_id_by_email_or_username(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_promo_code_usage(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validate_api_key(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_api_key_usage(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_admin_action(text,text,uuid,text,jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_public_usernames(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_public_usernames(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_user_id_by_email(text), public.lookup_user_id_by_email_or_username(text), public.increment_promo_code_usage(text), public.log_admin_action(text,text,uuid,text,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_api_key(text), public.record_api_key_usage(uuid), public.get_internal_secret() TO service_role;