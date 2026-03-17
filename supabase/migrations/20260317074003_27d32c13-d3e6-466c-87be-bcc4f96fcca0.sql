
-- =============================================
-- MODULE FREELANCING — Table 1: freelance_jobs
-- =============================================

CREATE TABLE public.freelance_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}',
  budget_min NUMERIC,
  budget_max NUMERIC,
  currency TEXT NOT NULL DEFAULT 'FC',
  location TEXT,
  island TEXT,
  is_remote BOOLEAN DEFAULT false,
  deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_freelance_jobs_author ON public.freelance_jobs(author_id);
CREATE INDEX idx_freelance_jobs_status ON public.freelance_jobs(status);
CREATE INDEX idx_freelance_jobs_category ON public.freelance_jobs(category);

-- Trigger updated_at (réutilise la fonction existante)
CREATE TRIGGER update_freelance_jobs_updated_at
  BEFORE UPDATE ON public.freelance_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.freelance_jobs ENABLE ROW LEVEL SECURITY;

-- Public peut voir les missions publiées
CREATE POLICY "Anyone can view published freelance jobs"
  ON public.freelance_jobs FOR SELECT
  TO public
  USING (status = 'published');

-- Auteur voit les siens
CREATE POLICY "Authors can view own freelance jobs"
  ON public.freelance_jobs FOR SELECT
  TO authenticated
  USING (author_id = auth.uid());

-- Annonceur+ peut créer
CREATE POLICY "Annonceurs can create freelance jobs"
  ON public.freelance_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'annonceur'::app_role) 
    AND author_id = auth.uid()
  );

-- Auteur peut modifier ses drafts
CREATE POLICY "Authors can update own draft freelance jobs"
  ON public.freelance_jobs FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid() AND status = 'draft')
  WITH CHECK (author_id = auth.uid() AND status = 'draft');

-- Auteur peut supprimer ses drafts
CREATE POLICY "Authors can delete own draft freelance jobs"
  ON public.freelance_jobs FOR DELETE
  TO authenticated
  USING (author_id = auth.uid() AND status = 'draft');

-- Admin/Mod gèrent tout
CREATE POLICY "Admins and moderators manage all freelance jobs"
  ON public.freelance_jobs FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'moderator'::app_role)
  );

-- Deny anon
CREATE POLICY "freelance_jobs_deny_anon"
  ON public.freelance_jobs FOR ALL
  TO anon
  USING (false);


-- =============================================
-- MODULE FREELANCING — Table 2: freelance_proposals
-- =============================================

CREATE TABLE public.freelance_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.freelance_jobs(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL,
  cover_letter TEXT NOT NULL,
  proposed_amount NUMERIC,
  currency TEXT NOT NULL DEFAULT 'FC',
  estimated_days INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, freelancer_id)
);

CREATE INDEX idx_freelance_proposals_job ON public.freelance_proposals(job_id);
CREATE INDEX idx_freelance_proposals_freelancer ON public.freelance_proposals(freelancer_id);

CREATE TRIGGER update_freelance_proposals_updated_at
  BEFORE UPDATE ON public.freelance_proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.freelance_proposals ENABLE ROW LEVEL SECURITY;

-- Freelancer voit les siennes
CREATE POLICY "Freelancers can view own proposals"
  ON public.freelance_proposals FOR SELECT
  TO authenticated
  USING (freelancer_id = auth.uid());

-- Auteur du job voit les candidatures
CREATE POLICY "Job authors can view proposals on their jobs"
  ON public.freelance_proposals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.freelance_jobs 
      WHERE id = job_id AND author_id = auth.uid()
    )
  );

-- Freelancer crée sa candidature
CREATE POLICY "Freelancers can create proposals"
  ON public.freelance_proposals FOR INSERT
  TO authenticated
  WITH CHECK (freelancer_id = auth.uid());

-- Freelancer modifie sa candidature pending
CREATE POLICY "Freelancers can update own pending proposals"
  ON public.freelance_proposals FOR UPDATE
  TO authenticated
  USING (freelancer_id = auth.uid() AND status = 'pending')
  WITH CHECK (freelancer_id = auth.uid() AND status = 'pending');

-- Freelancer peut retirer sa candidature pending
CREATE POLICY "Freelancers can delete own pending proposals"
  ON public.freelance_proposals FOR DELETE
  TO authenticated
  USING (freelancer_id = auth.uid() AND status = 'pending');

-- Auteur du job peut mettre à jour le statut des candidatures
CREATE POLICY "Job authors can update proposal status"
  ON public.freelance_proposals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.freelance_jobs 
      WHERE id = job_id AND author_id = auth.uid()
    )
  );

-- Admin/Mod gèrent tout
CREATE POLICY "Admins and moderators manage all proposals"
  ON public.freelance_proposals FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'moderator'::app_role)
  );

-- Deny anon
CREATE POLICY "freelance_proposals_deny_anon"
  ON public.freelance_proposals FOR ALL
  TO anon
  USING (false);


-- =============================================
-- MODULE FREELANCING — Table 3: freelance_reviews
-- =============================================

CREATE TABLE public.freelance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.freelance_jobs(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  reviewed_id UUID NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, reviewer_id)
);

-- Validation trigger au lieu de CHECK constraint pour le rating
CREATE OR REPLACE FUNCTION public.validate_freelance_review_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_review_rating
  BEFORE INSERT OR UPDATE ON public.freelance_reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_freelance_review_rating();

CREATE INDEX idx_freelance_reviews_job ON public.freelance_reviews(job_id);
CREATE INDEX idx_freelance_reviews_reviewed ON public.freelance_reviews(reviewed_id);

ALTER TABLE public.freelance_reviews ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les avis
CREATE POLICY "Anyone can view freelance reviews"
  ON public.freelance_reviews FOR SELECT
  TO public
  USING (true);

-- Utilisateur authentifié crée son avis
CREATE POLICY "Authenticated users can create reviews"
  ON public.freelance_reviews FOR INSERT
  TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

-- Admin/Mod gèrent tout
CREATE POLICY "Admins and moderators manage all reviews"
  ON public.freelance_reviews FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'moderator'::app_role)
  );

-- Deny anon insert/update/delete
CREATE POLICY "freelance_reviews_deny_anon"
  ON public.freelance_reviews FOR ALL
  TO anon
  USING (false);
