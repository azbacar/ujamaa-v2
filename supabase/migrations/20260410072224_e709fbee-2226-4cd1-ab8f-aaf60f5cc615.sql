
-- Fix get_user_role to properly handle 'annonceur' in the hierarchy
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = _user_id ORDER BY 
     CASE role 
       WHEN 'admin' THEN 1 
       WHEN 'moderator' THEN 2 
       WHEN 'annonceur' THEN 3
       WHEN 'user' THEN 4 
     END 
     LIMIT 1), 
    'user'::app_role
  )
$$;

-- Fix freelancer-avatars storage policies: enforce path-based ownership
DROP POLICY IF EXISTS "Users can upload freelancer avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own freelancer avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own freelancer avatars" ON storage.objects;

CREATE POLICY "Users can upload freelancer avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'freelancer-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own freelancer avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'freelancer-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own freelancer avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'freelancer-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
