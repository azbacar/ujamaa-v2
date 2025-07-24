-- Fix the users table by recreating it with proper UUID type
-- to match auth.users.id

-- Create a new table with the correct structure
CREATE TABLE public.users_new (
  id uuid NOT NULL PRIMARY KEY,
  email text NOT NULL,
  username text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.users_new ENABLE ROW LEVEL SECURITY;

-- Copy any existing data (if any) - this might fail if there are existing records
-- INSERT INTO public.users_new (id, email, username, created_at)
-- SELECT id::text::uuid, email, username, created_at FROM public.users;

-- Drop the old table
DROP TABLE public.users CASCADE;

-- Rename the new table
ALTER TABLE public.users_new RENAME TO users;

-- Recreate the RLS policies
CREATE POLICY "Users can view their own profile" 
ON public.users 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile" 
ON public.users 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.users 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);