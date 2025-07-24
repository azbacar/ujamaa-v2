-- Fix the data type mismatch for users.id column
-- Change from bigint to uuid to match auth.users.id

ALTER TABLE public.users ALTER COLUMN id TYPE uuid USING id::text::uuid;