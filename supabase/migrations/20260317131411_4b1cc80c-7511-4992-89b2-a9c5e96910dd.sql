-- Function to get public usernames (bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.get_public_usernames(_user_ids uuid[])
RETURNS TABLE(id uuid, username text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT u.id, u.username, u.avatar_url
  FROM public.users u
  WHERE u.id = ANY(_user_ids);
$$;