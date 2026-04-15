
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  name text NOT NULL DEFAULT '',
  permissions text[] NOT NULL DEFAULT '{login}',
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys_admin_all" ON public.api_keys FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "api_keys_deny_anon" ON public.api_keys FOR ALL TO anon USING (false);

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to validate API key (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.validate_api_key(_key_hash text)
RETURNS TABLE(id uuid, permissions text[], created_by uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ak.id, ak.permissions, ak.created_by
  FROM public.api_keys ak
  WHERE ak.key_hash = _key_hash
    AND ak.is_active = true
    AND (ak.expires_at IS NULL OR ak.expires_at > now());
$$;

-- Function to record API key usage
CREATE OR REPLACE FUNCTION public.record_api_key_usage(_key_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.api_keys SET last_used_at = now() WHERE id = _key_id;
$$;
