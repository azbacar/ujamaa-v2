-- Enable RLS on unprotected tables and create secure policies

-- Enable RLS on comments table
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Comments policies: Users can only access comments on posts they can see
CREATE POLICY "Users can view comments on accessible posts" 
ON public.comments 
FOR SELECT 
USING (true); -- For now, allow reading all comments (can be restricted later based on post visibility)

CREATE POLICY "Authenticated users can create comments" 
ON public.comments 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own comments" 
ON public.comments 
FOR UPDATE 
USING (auth.uid()::text = author_id::text);

CREATE POLICY "Users can delete their own comments" 
ON public.comments 
FOR DELETE 
USING (auth.uid()::text = author_id::text);

-- Enable RLS on posts table
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Posts policies: Public read access, authenticated write access
CREATE POLICY "Anyone can view posts" 
ON public.posts 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create posts" 
ON public.posts 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid()::text = author_id::text);

CREATE POLICY "Users can update their own posts" 
ON public.posts 
FOR UPDATE 
USING (auth.uid()::text = author_id::text);

CREATE POLICY "Users can delete their own posts" 
ON public.posts 
FOR DELETE 
USING (auth.uid()::text = author_id::text);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users policies: Users can only access their own data
CREATE POLICY "Users can view their own profile" 
ON public.users 
FOR SELECT 
USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" 
ON public.users 
FOR UPDATE 
USING (auth.uid()::text = id::text);

-- No INSERT policy for users table as user creation should be handled through auth
-- No DELETE policy to prevent users from deleting their accounts directly