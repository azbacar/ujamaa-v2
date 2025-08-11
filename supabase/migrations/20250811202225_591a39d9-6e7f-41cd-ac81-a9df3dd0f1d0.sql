-- Add user_id to ai_conversations and tighten RLS
ALTER TABLE public.ai_conversations
ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id
  ON public.ai_conversations(user_id);

-- Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Replace overly-permissive/incorrect policy using user_session with proper user_id based policy
DROP POLICY IF EXISTS "Authenticated users can manage their own AI conversations" ON public.ai_conversations;

CREATE POLICY "Users manage their own ai_conversations"
ON public.ai_conversations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow admins to view all users for admin UI while preserving other restrictions
CREATE POLICY IF NOT EXISTS "Admins can view all profiles"
ON public.users
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));