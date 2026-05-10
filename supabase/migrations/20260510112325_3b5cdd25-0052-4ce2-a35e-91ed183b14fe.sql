
-- Allow anon to SELECT rows, but revoke sensitive columns at column level.
DROP POLICY IF EXISTS "Public can read site settings rows" ON public.site_settings;
CREATE POLICY "Public can read site settings rows"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (true);

REVOKE SELECT (maintenance_mode, allow_registration, public_view_access,
               email_notifications, robots_txt, updated_by)
ON public.site_settings FROM anon;

-- Recreate the public view with security_invoker so RLS+column grants apply.
DROP VIEW IF EXISTS public.site_settings_public;
CREATE VIEW public.site_settings_public
WITH (security_invoker = true) AS
SELECT
  id,
  site_name, site_logo_url, site_favicon_url,
  hero_title, hero_subtitle, hero_image_url,
  og_title, og_description, og_image_url,
  twitter_card, twitter_site, seo_keywords,
  ai_assistant_name, ai_assistant_welcome_message, ai_assistant_enabled,
  island_images,
  ga_tracking_id
FROM public.site_settings;

GRANT SELECT ON public.site_settings_public TO anon, authenticated;
