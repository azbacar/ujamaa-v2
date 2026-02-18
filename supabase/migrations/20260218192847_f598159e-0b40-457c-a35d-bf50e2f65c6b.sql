-- Allow user_id to be NULL for guest conversations
ALTER TABLE public.ai_conversations ALTER COLUMN user_id DROP NOT NULL;

-- Add a service-role insert policy (the service role bypasses RLS, so this is just for clarity)
-- The existing RLS policies are fine since service_role_key bypasses RLS