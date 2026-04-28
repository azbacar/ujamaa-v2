DROP VIEW IF EXISTS public.users_pro_status;

CREATE VIEW public.users_pro_status
WITH (security_invoker = on) AS
SELECT
  u.id,
  (u.account_type = 'pro') AS is_pro
FROM public.users u;

GRANT SELECT ON public.users_pro_status TO anon, authenticated;

COMMENT ON VIEW public.users_pro_status IS
  'Vue publique minimale: id + is_pro. Pour afficher les contacts publics sur les publications d''un Pro.';