-- Restreindre l'accès aux colonnes de contact pour les utilisateurs anonymes (anon)
-- Conforme à la règle UJAMAAN : publications visibles à tous, contacts uniquement pour utilisateurs connectés Pro (ou auteur Pro)
-- PostgREST filtre automatiquement les colonnes non autorisées dans select=*

-- content_items : masquer contact_phone / contact_whatsapp à anon
REVOKE SELECT (contact_phone, contact_whatsapp) ON public.content_items FROM anon;

-- investments : masquer contact_phone / contact_email à anon
REVOKE SELECT (contact_phone, contact_email) ON public.investments FROM anon;

-- gastronomy_items : masquer contact_phone / contact_email / contact_whatsapp à anon
REVOKE SELECT (contact_phone, contact_email, contact_whatsapp) ON public.gastronomy_items FROM anon;

-- freelancer_profiles : masquer whatsapp à anon (accessible via RPC get_freelancer_whatsapp pour Pro)
REVOKE SELECT (whatsapp) ON public.freelancer_profiles FROM anon;

-- S'assurer que les utilisateurs authentifiés conservent un accès complet
-- (la RLS continue de filtrer ligne par ligne et ContactDisplay gère l'affichage Pro/non-Pro côté UI)
GRANT SELECT ON public.content_items TO authenticated;
GRANT SELECT ON public.investments TO authenticated;
GRANT SELECT ON public.gastronomy_items TO authenticated;
GRANT SELECT ON public.freelancer_profiles TO authenticated;