-- Public bucket for tender announcement attachments (PDF dossiers + cover images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('tender-attachments', 'tender-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read
CREATE POLICY "Tender attachments are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'tender-attachments');

-- Authenticated users can upload in their own folder
CREATE POLICY "Auth users upload tender attachments to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tender-attachments'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- Owner can update/delete
CREATE POLICY "Users update own tender attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'tender-attachments' AND (storage.foldername(name))[1] = (auth.uid())::text)
WITH CHECK (bucket_id = 'tender-attachments' AND (storage.foldername(name))[1] = (auth.uid())::text);

CREATE POLICY "Users delete own tender attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'tender-attachments' AND (storage.foldername(name))[1] = (auth.uid())::text);