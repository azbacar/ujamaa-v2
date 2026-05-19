-- Expose public site settings (including island_images) to anon visitors via the masked view.
ALTER VIEW public.site_settings_public SET (security_invoker = false);
GRANT SELECT ON public.site_settings_public TO anon, authenticated;