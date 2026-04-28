-- Extend users_pro_status with safe public fields (username, avatar_url)
DROP VIEW IF EXISTS public.users_pro_status CASCADE;

CREATE VIEW public.users_pro_status
WITH (security_invoker = on) AS
SELECT
  u.id,
  u.username,
  u.avatar_url,
  public.is_pro_user(u.id) AS is_pro
FROM public.users u;

GRANT SELECT ON public.users_pro_status TO anon, authenticated;