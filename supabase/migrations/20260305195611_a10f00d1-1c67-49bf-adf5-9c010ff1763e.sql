
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS island_images jsonb DEFAULT '{}'::jsonb;

-- Create a storage bucket for island images
INSERT INTO storage.buckets (id, name, public)
VALUES ('island-images', 'island-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to island images
CREATE POLICY "Public can view island images"
ON storage.objects FOR SELECT
USING (bucket_id = 'island-images');

-- Allow admins to upload island images
CREATE POLICY "Admins can upload island images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'island-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update island images
CREATE POLICY "Admins can update island images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'island-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete island images
CREATE POLICY "Admins can delete island images"
ON storage.objects FOR DELETE
USING (bucket_id = 'island-images' AND has_role(auth.uid(), 'admin'::app_role));
