
-- Table des profils entreprise
CREATE TABLE public.enterprise_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  rccm text,
  nif text,
  sector text NOT NULL DEFAULT 'general',
  address text,
  island text,
  city text,
  phone text,
  email text,
  website text,
  logo_url text,
  description text DEFAULT '',
  is_verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  verified_by uuid,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Table des soumissions aux appels d'offres
CREATE TABLE public.tender_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id uuid NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  enterprise_id uuid NOT NULL REFERENCES public.enterprise_profiles(id) ON DELETE CASCADE,
  cover_letter text NOT NULL,
  proposed_amount numeric,
  currency text NOT NULL DEFAULT 'FC',
  documents text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  review_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tender_id, enterprise_id)
);

-- Table des collaborateurs d'entreprise
CREATE TABLE public.enterprise_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id uuid NOT NULL REFERENCES public.enterprise_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(enterprise_id, user_id)
);

-- Fonction helper pour vérifier si un utilisateur a une entreprise
CREATE OR REPLACE FUNCTION public.has_enterprise(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enterprise_profiles
    WHERE user_id = _user_id AND status = 'active'
  )
$$;

-- Fonction helper pour récupérer l'enterprise_id d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_enterprise_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.enterprise_profiles
  WHERE user_id = _user_id AND status = 'active'
  LIMIT 1
$$;

-- RLS enterprise_profiles
ALTER TABLE public.enterprise_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active enterprises" ON public.enterprise_profiles
  FOR SELECT TO public USING (status = 'active');

CREATE POLICY "Users can create own enterprise" ON public.enterprise_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own enterprise" ON public.enterprise_profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own enterprise" ON public.enterprise_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins manage all enterprises" ON public.enterprise_profiles
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "enterprise_profiles_deny_anon" ON public.enterprise_profiles
  FOR ALL TO anon USING (false);

-- RLS tender_submissions
ALTER TABLE public.tender_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enterprise owners can create submissions" ON public.tender_submissions
  FOR INSERT TO authenticated
  WITH CHECK (enterprise_id = get_enterprise_id(auth.uid()));

CREATE POLICY "Enterprise owners can view own submissions" ON public.tender_submissions
  FOR SELECT TO authenticated
  USING (enterprise_id = get_enterprise_id(auth.uid()));

CREATE POLICY "Enterprise owners can update pending submissions" ON public.tender_submissions
  FOR UPDATE TO authenticated
  USING (enterprise_id = get_enterprise_id(auth.uid()) AND status = 'pending')
  WITH CHECK (enterprise_id = get_enterprise_id(auth.uid()) AND status = 'pending');

CREATE POLICY "Enterprise owners can delete pending submissions" ON public.tender_submissions
  FOR DELETE TO authenticated
  USING (enterprise_id = get_enterprise_id(auth.uid()) AND status = 'pending');

CREATE POLICY "Tender authors can view submissions" ON public.tender_submissions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM content_items WHERE id = tender_id AND author_id = auth.uid()));

CREATE POLICY "Admins manage all submissions" ON public.tender_submissions
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "tender_submissions_deny_anon" ON public.tender_submissions
  FOR ALL TO anon USING (false);

-- RLS enterprise_members
ALTER TABLE public.enterprise_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enterprise owners manage members" ON public.enterprise_members
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM enterprise_profiles WHERE id = enterprise_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM enterprise_profiles WHERE id = enterprise_id AND user_id = auth.uid()));

CREATE POLICY "Members can view own membership" ON public.enterprise_members
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins manage all members" ON public.enterprise_members
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "enterprise_members_deny_anon" ON public.enterprise_members
  FOR ALL TO anon USING (false);

-- Trigger pour updated_at
CREATE TRIGGER update_enterprise_profiles_updated_at
  BEFORE UPDATE ON public.enterprise_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tender_submissions_updated_at
  BEFORE UPDATE ON public.tender_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
