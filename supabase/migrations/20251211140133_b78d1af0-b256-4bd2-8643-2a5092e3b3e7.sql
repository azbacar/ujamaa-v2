-- Supprimer les données de test
DELETE FROM public.gastronomy_items WHERE title = 'madaba';
DELETE FROM public.events WHERE title = 'exemplr';

-- Insérer les paramètres complets du site
INSERT INTO public.site_settings (
  site_name,
  site_logo_url,
  site_favicon_url,
  hero_title,
  hero_subtitle,
  hero_image_url,
  ai_assistant_enabled,
  ai_assistant_name,
  ai_assistant_welcome_message,
  maintenance_mode,
  allow_registration,
  public_view_access,
  email_notifications
) VALUES (
  'Ujamaan',
  NULL,
  NULL,
  'Bienvenue sur Ujamaan',
  'Votre plateforme d''information pour les Comores et Mayotte',
  NULL,
  true,
  'Assistant UJAMAA',
  '🌺 Salut ! Je suis votre guide UJAMAA pour les Comores et Mayotte ! Que cherchez-vous : prix des marchés, événements, services admin... ? 🚀',
  false,
  true,
  true,
  true
) ON CONFLICT (id) DO NOTHING;