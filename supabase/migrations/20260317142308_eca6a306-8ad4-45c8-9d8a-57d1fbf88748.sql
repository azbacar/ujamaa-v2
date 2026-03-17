
-- =============================================
-- Phase 3: Diaspora Investment Module
-- =============================================

-- Table: diaspora_projects
CREATE TABLE public.diaspora_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  full_content text,
  category text NOT NULL DEFAULT 'agriculture',
  target_amount numeric NOT NULL DEFAULT 0,
  current_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'FC',
  author_id uuid NOT NULL,
  island text,
  location text,
  status text NOT NULL DEFAULT 'draft',
  images text[],
  deadline timestamp with time zone,
  min_investment numeric DEFAULT 0,
  contact_email text,
  contact_phone text,
  views integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: project_investments
CREATE TABLE public.project_investments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.diaspora_projects(id) ON DELETE CASCADE,
  investor_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'FC',
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  payment_reference text,
  message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: project_updates
CREATE TABLE public.project_updates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.diaspora_projects(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Trigger for updated_at on diaspora_projects
CREATE TRIGGER update_diaspora_projects_updated_at
  BEFORE UPDATE ON public.diaspora_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on project_investments
CREATE TRIGGER update_project_investments_updated_at
  BEFORE UPDATE ON public.project_investments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RLS: diaspora_projects
-- =============================================
ALTER TABLE public.diaspora_projects ENABLE ROW LEVEL SECURITY;

-- Anyone can view published projects
CREATE POLICY "Anyone can view published diaspora projects"
  ON public.diaspora_projects FOR SELECT
  TO public
  USING (status = 'published');

-- Authors can view own projects (any status)
CREATE POLICY "Authors can view own diaspora projects"
  ON public.diaspora_projects FOR SELECT
  TO authenticated
  USING (author_id = auth.uid());

-- Admins and moderators can view all
CREATE POLICY "Admins and moderators view all diaspora projects"
  ON public.diaspora_projects FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Authenticated users (annonceur OR normal user) can create projects
CREATE POLICY "Authenticated users can create diaspora projects"
  ON public.diaspora_projects FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- Authors can update own projects
CREATE POLICY "Authors can update own diaspora projects"
  ON public.diaspora_projects FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Admins and moderators can manage all
CREATE POLICY "Admins and moderators manage all diaspora projects"
  ON public.diaspora_projects FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Authors can delete own draft projects
CREATE POLICY "Authors can delete own draft diaspora projects"
  ON public.diaspora_projects FOR DELETE
  TO authenticated
  USING (author_id = auth.uid() AND status = 'draft');

-- Deny anon
CREATE POLICY "diaspora_projects_deny_anon"
  ON public.diaspora_projects FOR ALL
  TO anon
  USING (false);

-- =============================================
-- RLS: project_investments
-- =============================================
ALTER TABLE public.project_investments ENABLE ROW LEVEL SECURITY;

-- Investors can view own investments
CREATE POLICY "Investors can view own investments"
  ON public.project_investments FOR SELECT
  TO authenticated
  USING (investor_id = auth.uid());

-- Project authors can view investments on their projects
CREATE POLICY "Project authors can view investments"
  ON public.project_investments FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.diaspora_projects
    WHERE diaspora_projects.id = project_investments.project_id
    AND diaspora_projects.author_id = auth.uid()
  ));

-- Authenticated users can create investments
CREATE POLICY "Authenticated users can create investments"
  ON public.project_investments FOR INSERT
  TO authenticated
  WITH CHECK (investor_id = auth.uid());

-- Investors can update own pending investments
CREATE POLICY "Investors can update own pending investments"
  ON public.project_investments FOR UPDATE
  TO authenticated
  USING (investor_id = auth.uid() AND status = 'pending')
  WITH CHECK (investor_id = auth.uid() AND status = 'pending');

-- Project authors can update investment status
CREATE POLICY "Project authors can update investment status"
  ON public.project_investments FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.diaspora_projects
    WHERE diaspora_projects.id = project_investments.project_id
    AND diaspora_projects.author_id = auth.uid()
  ));

-- Admins manage all investments
CREATE POLICY "Admins manage all investments"
  ON public.project_investments FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Deny anon
CREATE POLICY "project_investments_deny_anon"
  ON public.project_investments FOR ALL
  TO anon
  USING (false);

-- =============================================
-- RLS: project_updates
-- =============================================
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;

-- Anyone can view updates for published projects
CREATE POLICY "Anyone can view updates for published projects"
  ON public.project_updates FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM public.diaspora_projects
    WHERE diaspora_projects.id = project_updates.project_id
    AND diaspora_projects.status = 'published'
  ));

-- Authors can manage own updates
CREATE POLICY "Authors can manage own project updates"
  ON public.project_updates FOR ALL
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Admins manage all updates
CREATE POLICY "Admins manage all project updates"
  ON public.project_updates FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Deny anon
CREATE POLICY "project_updates_deny_anon"
  ON public.project_updates FOR ALL
  TO anon
  USING (false);
