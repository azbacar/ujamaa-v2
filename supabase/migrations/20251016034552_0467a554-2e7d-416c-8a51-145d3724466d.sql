-- Update RLS policies for gastronomy_items to support annonceur role

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can create gastronomy items" ON public.gastronomy_items;
DROP POLICY IF EXISTS "Users can update their own gastronomy items" ON public.gastronomy_items;
DROP POLICY IF EXISTS "Users can delete their own gastronomy items" ON public.gastronomy_items;
DROP POLICY IF EXISTS "Anyone can view published gastronomy items" ON public.gastronomy_items;

-- Create new policies
-- Anyone can view published items
CREATE POLICY "Anyone can view published gastronomy items" 
ON public.gastronomy_items 
FOR SELECT 
USING (status = 'published');

-- Admins and moderators can view all items
CREATE POLICY "Admins and moderators can view all gastronomy items" 
ON public.gastronomy_items 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'moderator')
);

-- Annonceurs can view their own items
CREATE POLICY "Annonceurs can view their own gastronomy items" 
ON public.gastronomy_items 
FOR SELECT 
USING (
  has_role(auth.uid(), 'annonceur') AND 
  author_id = auth.uid()
);

-- Authenticated users and annonceurs can create items
CREATE POLICY "Authenticated users can create gastronomy items" 
ON public.gastronomy_items 
FOR INSERT 
WITH CHECK (
  auth.uid() = author_id AND
  (has_role(auth.uid(), 'annonceur') OR auth.uid() IS NOT NULL)
);

-- Annonceurs can update their own items, admins and moderators can update all
CREATE POLICY "Annonceurs can update their own gastronomy items" 
ON public.gastronomy_items 
FOR UPDATE 
USING (
  (has_role(auth.uid(), 'annonceur') AND author_id = auth.uid()) OR
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'moderator')
)
WITH CHECK (
  (has_role(auth.uid(), 'annonceur') AND author_id = auth.uid()) OR
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'moderator')
);

-- Annonceurs can delete their own items, admins can delete all
CREATE POLICY "Annonceurs can delete their own gastronomy items" 
ON public.gastronomy_items 
FOR DELETE 
USING (
  (has_role(auth.uid(), 'annonceur') AND author_id = auth.uid()) OR
  has_role(auth.uid(), 'admin')
);

-- Create function to check if an annonceur has pro account
CREATE OR REPLACE FUNCTION public.is_pro_annonceur(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    EXISTS (
      SELECT 1 
      FROM public.user_roles 
      WHERE user_id = _user_id AND role = 'annonceur'
    ) AND
    (SELECT account_type = 'pro' FROM public.users WHERE id = _user_id)
$$;