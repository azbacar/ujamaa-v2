-- ============================================
-- LOT 2 — Vue publique du statut Pro
-- Permet d'afficher les contacts sur les publications des Pro
-- sans exposer d'autres données sensibles de la table users
-- ============================================

CREATE OR REPLACE VIEW public.users_pro_status
WITH (security_invoker = on) AS
SELECT
  u.id,
  (u.account_type = 'pro') AS is_pro,
  COALESCE(u.username, '') AS username,
  u.avatar_url
FROM public.users u;

-- Accessible publiquement (lecture seule via la vue)
GRANT SELECT ON public.users_pro_status TO anon, authenticated;

COMMENT ON VIEW public.users_pro_status IS
  'Vue publique légère: id + is_pro + username + avatar. Permet d''afficher les contacts publics sur les publications d''un compte Pro.';