-- Create user roles system with 3 access levels
-- 1. Administrator: full access and modifications
-- 2. Moderator: receives modifications and announcements to approve
-- 3. User: normal user functionality

-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    assigned_at timestamp with time zone DEFAULT now(),
    assigned_by uuid REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);

-- Create pending_modifications table for moderator approval system
CREATE TABLE public.pending_modifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL, -- 'announcement', 'post', 'content_update', etc.
    title text NOT NULL,
    content jsonb NOT NULL, -- flexible structure for different types
    submitted_by uuid REFERENCES auth.users(id) NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by uuid REFERENCES auth.users(id),
    reviewed_at timestamp with time zone,
    review_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create admin_actions table for audit trail
CREATE TABLE public.admin_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid REFERENCES auth.users(id) NOT NULL,
    action_type text NOT NULL,
    target_type text, -- 'user', 'post', 'announcement', etc.
    target_id uuid,
    description text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = _user_id ORDER BY 
     CASE role 
       WHEN 'admin' THEN 1 
       WHEN 'moderator' THEN 2 
       WHEN 'user' THEN 3 
     END 
     LIMIT 1), 
    'user'::app_role
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for pending_modifications
CREATE POLICY "Users can view their own submissions"
ON public.pending_modifications
FOR SELECT
TO authenticated
USING (submitted_by = auth.uid());

CREATE POLICY "Moderators and admins can view all pending modifications"
ON public.pending_modifications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can submit modifications"
ON public.pending_modifications
FOR INSERT
TO authenticated
WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Moderators and admins can update modifications"
ON public.pending_modifications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for admin_actions
CREATE POLICY "Admins can view all admin actions"
ON public.admin_actions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create admin actions"
ON public.admin_actions
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND admin_id = auth.uid());

-- Function to create admin action log
CREATE OR REPLACE FUNCTION public.log_admin_action(
  _action_type text,
  _target_type text DEFAULT NULL,
  _target_id uuid DEFAULT NULL,
  _description text DEFAULT '',
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  action_id uuid;
BEGIN
  INSERT INTO public.admin_actions (admin_id, action_type, target_type, target_id, description, metadata)
  VALUES (auth.uid(), _action_type, _target_type, _target_id, _description, _metadata)
  RETURNING id INTO action_id;
  
  RETURN action_id;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pending_modifications_updated_at
  BEFORE UPDATE ON public.pending_modifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();