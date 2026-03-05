
-- =============================================
-- Phase 1: All new tables + RLS + seed data
-- =============================================

-- 1. homepage_sections
CREATE TABLE public.homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  title text NOT NULL DEFAULT '',
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  config jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read homepage sections" ON public.homepage_sections
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage homepage sections" ON public.homepage_sections
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default sections
INSERT INTO public.homepage_sections (section_key, title, sort_order) VALUES
  ('alerts', 'Alertes urgentes', 1),
  ('hero', 'Hero', 2),
  ('ads_header', 'Publicité header', 3),
  ('islands', 'Sélecteur d''îles', 4),
  ('announcements', 'Annonces', 5),
  ('categories', 'Catégories', 6),
  ('ads_content', 'Publicité contenu', 7),
  ('quick_actions', 'Actions rapides', 8),
  ('ads_sidebar', 'Publicité sidebar', 9),
  ('statistics', 'Statistiques', 10),
  ('ads_sidebar_2', 'Publicité sidebar 2', 11),
  ('ai_assistant', 'Assistant IA', 12);

-- 2. content_comments
CREATE TABLE public.content_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comments" ON public.content_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert own comments" ON public.content_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.content_comments
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.content_comments
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins and moderators can delete any comment" ON public.content_comments
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- 3. favorites
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_type, content_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites" ON public.favorites
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. reports
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  reason text NOT NULL,
  details text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert own reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins and moderators can view all reports" ON public.reports
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Admins and moderators can update reports" ON public.reports
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- 5. announcer_privileges
CREATE TABLE public.announcer_privileges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  privilege text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  granted_by uuid,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, privilege)
);

ALTER TABLE public.announcer_privileges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own privileges" ON public.announcer_privileges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all privileges" ON public.announcer_privileges
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 6. Allow annonceurs to insert own content_items as draft
CREATE POLICY "Annonceurs can insert own content as draft" ON public.content_items
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'annonceur'::app_role)
    AND author_id = auth.uid()
    AND status = 'draft'::content_status
  );

-- Allow annonceurs to view their own content
CREATE POLICY "Annonceurs can view own content" ON public.content_items
  FOR SELECT USING (
    has_role(auth.uid(), 'annonceur'::app_role) AND author_id = auth.uid()
  );

-- Allow annonceurs to update own draft content
CREATE POLICY "Annonceurs can update own draft content" ON public.content_items
  FOR UPDATE USING (
    has_role(auth.uid(), 'annonceur'::app_role) AND author_id = auth.uid() AND status = 'draft'::content_status
  ) WITH CHECK (
    has_role(auth.uid(), 'annonceur'::app_role) AND author_id = auth.uid()
  );

-- Trigger for updated_at on content_comments
CREATE TRIGGER update_content_comments_updated_at
  BEFORE UPDATE ON public.content_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on homepage_sections
CREATE TRIGGER update_homepage_sections_updated_at
  BEFORE UPDATE ON public.homepage_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
