-- Fix RLS policies to properly restrict access to authenticated users only
-- and fix the search path warning

-- Fix function search path
ALTER FUNCTION public.handle_new_user() SET search_path = 'public, auth';

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can manage their own AI conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can view comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can view posts" ON public.posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Create properly restricted policies for ai_conversations
CREATE POLICY "Authenticated users can manage their own AI conversations" 
ON public.ai_conversations 
FOR ALL 
TO authenticated
USING (auth.uid()::text = user_session::text)
WITH CHECK (auth.uid()::text = user_session::text);

-- Create properly restricted policies for comments
CREATE POLICY "Authenticated users can view comments" 
ON public.comments 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create comments" 
ON public.comments 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid()::text = author_id::text);

CREATE POLICY "Users can update their own comments" 
ON public.comments 
FOR UPDATE 
TO authenticated
USING (auth.uid()::text = author_id::text)
WITH CHECK (auth.uid()::text = author_id::text);

CREATE POLICY "Users can delete their own comments" 
ON public.comments 
FOR DELETE 
TO authenticated
USING (auth.uid()::text = author_id::text);

-- Create properly restricted policies for posts
CREATE POLICY "Authenticated users can view posts" 
ON public.posts 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create posts" 
ON public.posts 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid()::text = author_id::text);

CREATE POLICY "Users can update their own posts" 
ON public.posts 
FOR UPDATE 
TO authenticated
USING (auth.uid()::text = author_id::text)
WITH CHECK (auth.uid()::text = author_id::text);

CREATE POLICY "Users can delete their own posts" 
ON public.posts 
FOR DELETE 
TO authenticated
USING (auth.uid()::text = author_id::text);

-- Create properly restricted policies for users
CREATE POLICY "Users can view their own profile" 
ON public.users 
FOR SELECT 
TO authenticated
USING (auth.uid()::text = id::text);

CREATE POLICY "Users can create their own profile" 
ON public.users 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" 
ON public.users 
FOR UPDATE 
TO authenticated
USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);