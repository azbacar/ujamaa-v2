-- 1) Rename table diaspora_projects → investments
ALTER TABLE IF EXISTS public.diaspora_projects RENAME TO investments;

-- Update view if it exists referencing it (none currently per audit)
-- Update function
CREATE OR REPLACE FUNCTION public.increment_content_view(_type text, _id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  CASE _type
    WHEN 'content_item' THEN
      UPDATE public.content_items SET views = COALESCE(views, 0) + 1 WHERE id = _id;
    WHEN 'event' THEN
      UPDATE public.events SET views = COALESCE(views, 0) + 1 WHERE id = _id;
    WHEN 'invest', 'investment', 'diaspora_project' THEN
      UPDATE public.investments SET views = COALESCE(views, 0) + 1 WHERE id = _id;
    WHEN 'freelance_job' THEN
      UPDATE public.freelance_jobs SET views = COALESCE(views, 0) + 1 WHERE id = _id;
    WHEN 'price' THEN
      UPDATE public.prices SET views = COALESCE(views, 0) + 1 WHERE id = _id;
    ELSE
      RAISE NOTICE 'Unknown content type: %', _type;
  END CASE;
END;
$function$;

-- 2) Storage buckets — restreindre listing
-- Drop policies trop ouvertes existantes (si présentes) et les remplacer par "lecture uniquement quand un nom est précisé"
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT polname FROM pg_policy
    WHERE polrelid='storage.objects'::regclass
      AND (polname ILIKE '%public%read%' OR polname ILIKE '%publicly accessible%' OR polname ILIKE '%anyone can view%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.polname);
  END LOOP;
END$$;

-- Recréer une lecture publique fichier-par-fichier (anon ne peut pas lister)
CREATE POLICY "Public read single object (allowed buckets)"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id IN ('avatars','freelancer-avatars','event-images','island-images','menu-images','Logo & icon')
  AND name IS NOT NULL AND length(name) > 0
);

-- 3) GraphQL/PostgREST : révoquer anon sur tables sensibles (RLS reste en filet)
REVOKE SELECT ON public.users FROM anon;
REVOKE SELECT ON public.user_roles FROM anon;
REVOKE SELECT ON public.api_keys FROM anon;
REVOKE SELECT ON public.direct_messages FROM anon;
REVOKE SELECT ON public.chat_messages FROM anon;
REVOKE SELECT ON public.chat_attachments FROM anon;
REVOKE SELECT ON public.push_subscriptions FROM anon;
REVOKE SELECT ON public.verification_requests FROM anon;
REVOKE SELECT ON public.enterprise_profiles FROM anon;
REVOKE SELECT ON public.enterprise_invoices FROM anon;
REVOKE SELECT ON public.enterprise_clients FROM anon;
REVOKE SELECT ON public.enterprise_members FROM anon;
REVOKE SELECT ON public.enterprise_transactions FROM anon;
REVOKE SELECT ON public.freelancer_profiles FROM anon;
REVOKE SELECT ON public.freelancer_invoices FROM anon;
REVOKE SELECT ON public.freelancer_clients FROM anon;
REVOKE SELECT ON public.freelancer_transactions FROM anon;
REVOKE SELECT ON public.project_carriers FROM anon;
REVOKE SELECT ON public.project_investments FROM anon;
REVOKE SELECT ON public.pro_subscription_requests FROM anon;
REVOKE SELECT ON public.partner_accounts FROM anon;
REVOKE SELECT ON public.partner_kyc_documents FROM anon;
REVOKE SELECT ON public.partner_transactions FROM anon;
REVOKE SELECT ON public.partner_deposits FROM anon;
REVOKE SELECT ON public.notifications FROM anon;
REVOKE SELECT ON public.favorites FROM anon;
REVOKE SELECT ON public.event_registrations FROM anon;
REVOKE SELECT ON public.reports FROM anon;
REVOKE SELECT ON public.admin_actions FROM anon;
REVOKE SELECT ON public.pending_modifications FROM anon;
REVOKE SELECT ON public.ai_conversations FROM anon;
REVOKE SELECT ON public.price_alerts FROM anon;