DROP VIEW IF EXISTS public.users_pro_status CASCADE;

-- security_invoker=off (default) → la vue s'exécute avec les droits du créateur
-- (postgres), ce qui est sûr car elle ne projette QUE des champs publics non sensibles.
CREATE VIEW public.users_pro_status AS
SELECT
  u.id,
  u.username,
  u.avatar_url,
  public.is_pro_user(u.id) AS is_pro
FROM public.users u;

GRANT SELECT ON public.users_pro_status TO anon, authenticated;