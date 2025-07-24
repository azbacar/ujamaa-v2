-- Fix security warnings by restricting policies to authenticated users only

-- Update comments policies to require authentication
DROP POLICY IF EXISTS "Users can view comments on accessible posts" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

CREATE POLICY "Authenticated users can view comments" 
ON public.comments 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can update their own comments" 
ON public.comments 
FOR UPDATE 
TO authenticated
USING (auth.uid()::text = author_id::text);

CREATE POLICY "Users can delete their own comments" 
ON public.comments 
FOR DELETE 
TO authenticated
USING (auth.uid()::text = author_id::text);

-- Update posts policies to restrict some operations to authenticated users
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;

CREATE POLICY "Users can update their own posts" 
ON public.posts 
FOR UPDATE 
TO authenticated
USING (auth.uid()::text = author_id::text);

CREATE POLICY "Users can delete their own posts" 
ON public.posts 
FOR DELETE 
TO authenticated
USING (auth.uid()::text = author_id::text);

-- Update users policies to require authentication
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

CREATE POLICY "Users can view their own profile" 
ON public.users 
FOR SELECT 
TO authenticated
USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" 
ON public.users 
FOR UPDATE 
TO authenticated
USING (auth.uid()::text = id::text);

-- Update ai_conversations policy to require authentication
DROP POLICY IF EXISTS "Users can view and create their own AI conversations" ON public.ai_conversations;

CREATE POLICY "Authenticated users can manage their own AI conversations" 
ON public.ai_conversations 
FOR ALL
TO authenticated
USING (auth.uid()::text = user_session::text)
WITH CHECK (auth.uid()::text = user_session::text);