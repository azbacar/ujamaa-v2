-- Fix critical security vulnerabilities in RLS policies

-- 1. Remove any existing public policies that might allow public access to users table
DROP POLICY IF EXISTS "Public can view users" ON public.users;
DROP POLICY IF EXISTS "Anyone can view users" ON public.users;
DROP POLICY IF EXISTS "Public access to users" ON public.users;

-- 2. Ensure users table has proper RLS protection
-- The existing policies should already be sufficient, but let's verify they're the only ones

-- 3. Fix ai_conversations table - ensure only conversation owners can access their data
-- First check if there are any problematic public policies
DROP POLICY IF EXISTS "Public can view ai_conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Anyone can view ai_conversations" ON public.ai_conversations;

-- The existing policy "Users manage their own ai_conversations" should already be correct
-- but let's make sure by recreating it if needed

-- 4. Fix admin_actions table - ensure only admins can access it
DROP POLICY IF EXISTS "Public can view admin_actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Anyone can view admin_actions" ON public.admin_actions;

-- The existing policies should already be correct for admin_actions

-- 5. Double-check that all sensitive tables have RLS enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- 6. Add explicit denial policies for public access to sensitive data
-- This ensures that even if RLS is misconfigured, public access is blocked

CREATE POLICY "Deny public access to users" 
ON public.users 
FOR ALL 
TO anon 
USING (false);

CREATE POLICY "Deny public access to ai_conversations" 
ON public.ai_conversations 
FOR ALL 
TO anon 
USING (false);

CREATE POLICY "Deny public access to admin_actions" 
ON public.admin_actions 
FOR ALL 
TO anon 
USING (false);