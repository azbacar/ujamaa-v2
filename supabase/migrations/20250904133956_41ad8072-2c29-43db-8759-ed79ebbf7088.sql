-- Fix RLS policies - properly handle existing policies

-- Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Deny public access to users" ON public.users;
DROP POLICY IF EXISTS "Deny all public access to users" ON public.users;

-- Drop ALL existing policies on ai_conversations table
DROP POLICY IF EXISTS "Users manage their own ai_conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Deny public access to ai_conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can create their own conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Deny all public access to ai_conversations" ON public.ai_conversations;

-- Drop ALL existing policies on admin_actions table
DROP POLICY IF EXISTS "Admins can create admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Admins can view all admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Deny public access to admin_actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Only admins can view admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Only admins can create admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Deny all public access to admin_actions" ON public.admin_actions;

-- Create secure policies for users table
CREATE POLICY "users_authenticated_select_own"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "users_authenticated_insert_own"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "users_authenticated_update_own"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "users_admin_select_all"
ON public.users
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "users_deny_anon_access"
ON public.users
FOR ALL
TO anon
USING (false);

-- Create secure policies for ai_conversations table
CREATE POLICY "conversations_user_select_own"
ON public.ai_conversations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "conversations_user_insert_own"
ON public.ai_conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conversations_user_update_own"
ON public.ai_conversations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conversations_user_delete_own"
ON public.ai_conversations
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "conversations_deny_anon_access"
ON public.ai_conversations
FOR ALL
TO anon
USING (false);

-- Create secure policies for admin_actions table
CREATE POLICY "admin_actions_admin_select"
ON public.admin_actions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin_actions_admin_insert"
ON public.admin_actions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND admin_id = auth.uid());

CREATE POLICY "admin_actions_deny_anon_access"
ON public.admin_actions
FOR ALL
TO anon
USING (false);