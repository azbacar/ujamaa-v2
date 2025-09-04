-- Fix RLS policies to prevent unauthorized access

-- Drop existing problematic policies on users table
DROP POLICY IF EXISTS "Deny public access to users" ON public.users;

-- Create strict policies for users table
CREATE POLICY "Users can view their own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.users
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix ai_conversations policies
DROP POLICY IF EXISTS "Deny public access to ai_conversations" ON public.ai_conversations;

CREATE POLICY "Users can view their own conversations"
ON public.ai_conversations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
ON public.ai_conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
ON public.ai_conversations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
ON public.ai_conversations
FOR DELETE
USING (auth.uid() = user_id);

-- Fix admin_actions policies
DROP POLICY IF EXISTS "Deny public access to admin_actions" ON public.admin_actions;

CREATE POLICY "Only admins can view admin actions"
ON public.admin_actions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can create admin actions"
ON public.admin_actions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND admin_id = auth.uid());

-- Ensure no public access to sensitive tables
CREATE POLICY "Deny all public access to users"
ON public.users
FOR ALL
TO anon
USING (false);

CREATE POLICY "Deny all public access to ai_conversations"
ON public.ai_conversations
FOR ALL
TO anon
USING (false);

CREATE POLICY "Deny all public access to admin_actions"
ON public.admin_actions
FOR ALL
TO anon
USING (false);