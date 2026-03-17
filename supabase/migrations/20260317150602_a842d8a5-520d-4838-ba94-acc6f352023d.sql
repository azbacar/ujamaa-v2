-- Table des porteurs de projet (similaire à freelancer_profiles)
CREATE TABLE public.project_carriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  bio text DEFAULT '',
  phone text,
  email text,
  island text,
  location text,
  organization text,
  is_verified boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.project_carriers ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active carrier profiles"
  ON public.project_carriers FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Users can view own carrier profile"
  ON public.project_carriers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own carrier profile"
  ON public.project_carriers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own carrier profile"
  ON public.project_carriers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own carrier profile"
  ON public.project_carriers FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage all carrier profiles"
  ON public.project_carriers FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "project_carriers_deny_anon"
  ON public.project_carriers FOR ALL
  TO anon
  USING (false);

-- Updated_at trigger
CREATE TRIGGER update_project_carriers_updated_at
  BEFORE UPDATE ON public.project_carriers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check if user can create diaspora projects
CREATE OR REPLACE FUNCTION public.is_project_carrier(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_carriers
    WHERE user_id = _user_id AND is_active = true
  )
$$;

-- Update diaspora_projects INSERT policy: require annonceur role OR carrier profile
DROP POLICY IF EXISTS "Authenticated users can create diaspora projects" ON public.diaspora_projects;

CREATE POLICY "Annonceurs or carriers can create diaspora projects"
  ON public.diaspora_projects FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid() 
    AND (
      has_role(auth.uid(), 'annonceur'::app_role) 
      OR is_project_carrier(auth.uid())
    )
  );