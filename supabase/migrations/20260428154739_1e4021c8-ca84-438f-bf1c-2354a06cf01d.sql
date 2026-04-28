-- Restore SELECT grants lost during GraphQL schema lockdown.
-- These objects are protected by RLS (or are SECURITY INVOKER views over RLS-protected
-- base tables) so granting SELECT to anon/authenticated is safe.

GRANT SELECT ON public.freelancer_profiles_public TO anon, authenticated;
GRANT SELECT ON public.users_pro_status TO anon, authenticated;
GRANT SELECT ON public.gastronomy_items TO anon, authenticated;

-- Other public-facing views/tables that should remain readable by visitors
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT table_name, table_type
    FROM information_schema.tables
    WHERE table_schema='public'
      AND table_name IN (
        'content_items_public',
        'enterprise_profiles_public',
        'project_carriers_public',
        'diaspora_projects_public',
        'freelance_jobs_public',
        'tourism_places',
        'taxi_prices',
        'pharmacies',
        'menu_items',
        'recipes'
      )
  LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', r.table_name);
  END LOOP;
END $$;