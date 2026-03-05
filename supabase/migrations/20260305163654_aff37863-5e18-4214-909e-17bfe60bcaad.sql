
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS og_title text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS og_description text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS og_image_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS twitter_card text DEFAULT 'summary_large_image',
  ADD COLUMN IF NOT EXISTS twitter_site text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS seo_keywords text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS robots_txt text DEFAULT NULL;
