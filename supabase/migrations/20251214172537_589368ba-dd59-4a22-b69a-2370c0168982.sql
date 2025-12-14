-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('event-images', 'event-images', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view event images (public bucket)
CREATE POLICY "Anyone can view event images"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');

-- Allow authenticated users to upload event images
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-images' AND auth.uid() IS NOT NULL);

-- Allow users to update their own uploaded images
CREATE POLICY "Users can update their own event images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own uploaded images
CREATE POLICY "Users can delete their own event images"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);