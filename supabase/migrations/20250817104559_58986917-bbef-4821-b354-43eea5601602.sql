-- Fix critical security vulnerabilities - targeted approach

-- 1. Remove any potential public access policies that shouldn't exist
DROP POLICY IF EXISTS "Public can view users" ON public.users;
DROP POLICY IF EXISTS "Anyone can view users" ON public.users;
DROP POLICY IF EXISTS "Public access to users" ON public.users;
DROP POLICY IF EXISTS "Public can view ai_conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Anyone can view ai_conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Public can view admin_actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Anyone can view admin_actions" ON public.admin_actions;

-- 2. Ensure RLS is enabled on all sensitive tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- 3. Only create denial policies if they don't exist
DO $$
BEGIN
    -- Check and create denial policy for users table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Deny public access to users'
    ) THEN
        EXECUTE 'CREATE POLICY "Deny public access to users" ON public.users FOR ALL TO anon USING (false)';
    END IF;

    -- Check and create denial policy for ai_conversations table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_conversations' 
        AND policyname = 'Deny public access to ai_conversations'
    ) THEN
        EXECUTE 'CREATE POLICY "Deny public access to ai_conversations" ON public.ai_conversations FOR ALL TO anon USING (false)';
    END IF;

    -- Check and create denial policy for admin_actions table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'admin_actions' 
        AND policyname = 'Deny public access to admin_actions'
    ) THEN
        EXECUTE 'CREATE POLICY "Deny public access to admin_actions" ON public.admin_actions FOR ALL TO anon USING (false)';
    END IF;
END $$;