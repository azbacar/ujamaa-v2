-- Add site customization fields to site_settings
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS site_name TEXT DEFAULT 'Ujamaan',
ADD COLUMN IF NOT EXISTS site_logo_url TEXT,
ADD COLUMN IF NOT EXISTS site_favicon_url TEXT,
ADD COLUMN IF NOT EXISTS hero_title TEXT DEFAULT 'Bienvenue sur Ujamaan',
ADD COLUMN IF NOT EXISTS hero_subtitle TEXT DEFAULT 'Votre plateforme d''information pour les Comores',
ADD COLUMN IF NOT EXISTS hero_image_url TEXT;