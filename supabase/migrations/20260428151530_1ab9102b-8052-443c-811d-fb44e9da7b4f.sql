
-- ============================================================
-- Révocation SELECT à anon sur les tables sensibles
-- (RLS continue de protéger les lignes — ceci masque l'objet du schéma GraphQL)
-- ============================================================

-- Données utilisateurs personnelles
REVOKE SELECT ON public.users FROM anon;
REVOKE SELECT ON public.user_roles FROM anon;
REVOKE SELECT ON public.notifications FROM anon;
REVOKE SELECT ON public.favorites FROM anon;
REVOKE SELECT ON public.price_alerts FROM anon;
REVOKE SELECT ON public.push_subscriptions FROM anon;

-- Messagerie & communications privées
REVOKE SELECT ON public.direct_messages FROM anon;
REVOKE SELECT ON public.chat_messages FROM anon;
REVOKE SELECT ON public.chat_attachments FROM anon;
REVOKE SELECT ON public.ai_conversations FROM anon;
REVOKE SELECT ON public.content_comments FROM anon;

-- KYC, abonnements, privilèges
REVOKE SELECT ON public.verification_requests FROM anon;
REVOKE SELECT ON public.pro_subscription_requests FROM anon;
REVOKE SELECT ON public.announcer_privileges FROM anon;
REVOKE SELECT ON public.promo_codes FROM anon;

-- Freelance CRM (privé)
REVOKE SELECT ON public.freelancer_profiles FROM anon;
REVOKE SELECT ON public.freelance_proposals FROM anon;
REVOKE SELECT ON public.freelancer_clients FROM anon;
REVOKE SELECT ON public.freelancer_invoices FROM anon;
REVOKE SELECT ON public.freelancer_transactions FROM anon;

-- Enterprise CRM (privé)
REVOKE SELECT ON public.enterprise_profiles FROM anon;
REVOKE SELECT ON public.enterprise_members FROM anon;
REVOKE SELECT ON public.enterprise_clients FROM anon;
REVOKE SELECT ON public.enterprise_invoices FROM anon;
REVOKE SELECT ON public.enterprise_transactions FROM anon;
REVOKE SELECT ON public.tender_submissions FROM anon;

-- Diaspora (privé)
REVOKE SELECT ON public.project_carriers FROM anon;
REVOKE SELECT ON public.project_investments FROM anon;
REVOKE SELECT ON public.project_updates FROM anon;

-- Événements (inscriptions privées, événements eux-mêmes restent publics)
REVOKE SELECT ON public.event_registrations FROM anon;

-- Modération & admin
REVOKE SELECT ON public.admin_actions FROM anon;
REVOKE SELECT ON public.reports FROM anon;
REVOKE SELECT ON public.pending_modifications FROM anon;
REVOKE SELECT ON public.site_analytics FROM anon;

-- Partenaires & infrastructure
REVOKE SELECT ON public.partner_accounts FROM anon;
REVOKE SELECT ON public.partner_transactions FROM anon;
REVOKE SELECT ON public.vendor_locations FROM anon;
REVOKE SELECT ON public.api_keys FROM anon;

-- ============================================================
-- Confirmer SELECT à anon sur les objets PUBLICS légitimes
-- ============================================================
GRANT SELECT ON public.content_items TO anon;
GRANT SELECT ON public.events TO anon;
GRANT SELECT ON public.prices TO anon;
GRANT SELECT ON public.price_history TO anon;
GRANT SELECT ON public.diaspora_projects TO anon;
GRANT SELECT ON public.freelance_jobs TO anon;
GRANT SELECT ON public.freelance_reviews TO anon;
GRANT SELECT ON public.gastronomy_items TO anon;
GRANT SELECT ON public.restaurant_menu_items TO anon;
GRANT SELECT ON public.recipe_ingredients TO anon;
GRANT SELECT ON public.pharmacy_guards TO anon;
GRANT SELECT ON public.taxi_fares TO anon;
GRANT SELECT ON public.static_pages TO anon;
GRANT SELECT ON public.homepage_categories TO anon;
GRANT SELECT ON public.homepage_sections TO anon;
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT ON public.global_announcements TO anon;
GRANT SELECT ON public.ads TO anon;
GRANT SELECT ON public.ai_knowledge_sources TO anon;
GRANT SELECT ON public.partner_settings TO anon;

-- Vues publiques
GRANT SELECT ON public.users_pro_status TO anon;
GRANT SELECT ON public.enterprise_profiles_public TO anon;
GRANT SELECT ON public.freelancer_profiles_public TO anon;
GRANT SELECT ON public.project_carriers_public TO anon;

-- ============================================================
-- Marquer explicitement les tables sensibles "hors GraphQL"
-- via le commentaire pg_graphql qui désactive l'inférence
-- ============================================================
COMMENT ON TABLE public.users IS E'@graphql({"totalCount": {"enabled": false}}) Sensitive: anon access revoked';
COMMENT ON TABLE public.user_roles IS 'Sensitive: anon access revoked';
COMMENT ON TABLE public.api_keys IS 'Sensitive: anon access revoked';
COMMENT ON TABLE public.verification_requests IS 'Sensitive KYC: anon access revoked';
COMMENT ON TABLE public.direct_messages IS 'Private messaging: anon access revoked';
COMMENT ON TABLE public.notifications IS 'Private: anon access revoked';
