CREATE OR REPLACE FUNCTION public.lookup_user_id_by_email_or_username(_identifier text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id
  FROM public.users u
  WHERE lower(u.email) = lower(trim(_identifier))
     OR lower(u.username) = lower(trim(_identifier))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_user_id_by_email_or_username(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_user_id_by_email_or_username(text) TO service_role;