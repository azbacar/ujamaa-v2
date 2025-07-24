-- Fix RLS policies for better security
-- Remove overly permissive policies and require authentication

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
DROP POLICY IF EXISTS "Authenticated users can view comments" ON public.comments;

-- Create secure policies that require authentication
CREATE POLICY "Authenticated users can view posts" 
ON public.posts 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view comments" 
ON public.comments 
FOR SELECT 
TO authenticated
USING (true);

-- Update user table to allow profile creation for new authenticated users
CREATE POLICY "Users can create their own profile" 
ON public.users 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid()::text = id::text);

-- Create a function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();