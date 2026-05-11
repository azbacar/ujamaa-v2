
INSERT INTO storage.buckets (id, name, public)
VALUES ('tender-documents', 'tender-documents', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read tender documents" ON storage.objects;
CREATE POLICY "Public read tender documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tender-documents');

DROP POLICY IF EXISTS "Auth users upload tender documents to own folder" ON storage.objects;
CREATE POLICY "Auth users upload tender documents to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'tender-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users update own tender documents" ON storage.objects;
CREATE POLICY "Users update own tender documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'tender-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'tender-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users delete own tender documents" ON storage.objects;
CREATE POLICY "Users delete own tender documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'tender-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
