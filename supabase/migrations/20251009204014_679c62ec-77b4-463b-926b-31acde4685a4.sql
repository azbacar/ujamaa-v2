-- Create enum for gastronomy item types
CREATE TYPE public.gastronomy_type AS ENUM ('recipe', 'restaurant_dish', 'hotel_room', 'private_room');

-- Create enum for user account types
CREATE TYPE public.account_type AS ENUM ('free', 'pro');

-- Add account_type to users table
ALTER TABLE public.users 
ADD COLUMN account_type account_type NOT NULL DEFAULT 'free',
ADD COLUMN pro_features jsonb DEFAULT '{}'::jsonb;

-- Create gastronomy_items table
CREATE TABLE public.gastronomy_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  author_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type gastronomy_type NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  price_min numeric,
  price_max numeric,
  images text[],
  contact_phone text,
  contact_email text,
  contact_whatsapp text,
  location text,
  category text,
  status content_status NOT NULL DEFAULT 'published',
  views integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.gastronomy_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gastronomy_items
CREATE POLICY "Anyone can view published gastronomy items"
ON public.gastronomy_items
FOR SELECT
USING (status = 'published');

CREATE POLICY "Authenticated users can create gastronomy items"
ON public.gastronomy_items
FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own gastronomy items"
ON public.gastronomy_items
FOR UPDATE
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own gastronomy items"
ON public.gastronomy_items
FOR DELETE
USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all gastronomy items"
ON public.gastronomy_items
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_gastronomy_items_updated_at
BEFORE UPDATE ON public.gastronomy_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if user has pro account
CREATE OR REPLACE FUNCTION public.is_pro_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT account_type = 'pro'
  FROM public.users
  WHERE id = _user_id
$$;