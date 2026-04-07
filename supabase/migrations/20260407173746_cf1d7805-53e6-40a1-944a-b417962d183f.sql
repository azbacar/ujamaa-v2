-- Add avatar, contact and social fields to freelancer_profiles
ALTER TABLE public.freelancer_profiles
  ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS whatsapp text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS facebook_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS linkedin_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS twitter_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS instagram_url text DEFAULT NULL;

-- Create storage bucket for freelancer avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('freelancer-avatars', 'freelancer-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view freelancer avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'freelancer-avatars');

CREATE POLICY "Authenticated users can upload freelancer avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'freelancer-avatars');

CREATE POLICY "Users can update own freelancer avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'freelancer-avatars');

CREATE POLICY "Users can delete own freelancer avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'freelancer-avatars');