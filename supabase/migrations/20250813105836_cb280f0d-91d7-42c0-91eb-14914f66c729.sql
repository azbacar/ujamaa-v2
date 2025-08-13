-- 1) Enums for content and announcements
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type') THEN
    CREATE TYPE public.content_type AS ENUM ('announcement','event','service','tender');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_status') THEN
    CREATE TYPE public.content_status AS ENUM ('published','draft','archived');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'announcement_kind') THEN
    CREATE TYPE public.announcement_kind AS ENUM ('info','warning','urgent','maintenance');
  END IF;
END $$;

-- 2) Content items table (single table for all managed content)
CREATE TABLE IF NOT EXISTS public.content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.content_type NOT NULL,
  title text NOT NULL,
  description text,
  category text,
  status public.content_status NOT NULL DEFAULT 'draft',
  author_id uuid NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  views integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_items_type ON public.content_items(type);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON public.content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_published_at ON public.content_items(published_at DESC);

-- RLS Policies for content_items
DO $$ BEGIN
  -- Public can read published content
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='content_items' AND policyname='Public can view published content'
  ) THEN
    CREATE POLICY "Public can view published content"
    ON public.content_items
    FOR SELECT
    USING (status = 'published'::public.content_status);
  END IF;

  -- Admins and moderators can view all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='content_items' AND policyname='Admins and moderators can view all content'
  ) THEN
    CREATE POLICY "Admins and moderators can view all content"
    ON public.content_items
    FOR SELECT
    USING (has_role(auth.uid(), 'admin'::public.app_role) OR has_role(auth.uid(), 'moderator'::public.app_role));
  END IF;

  -- Create content
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='content_items' AND policyname='Admins and moderators can create content'
  ) THEN
    CREATE POLICY "Admins and moderators can create content"
    ON public.content_items
    FOR INSERT
    WITH CHECK (has_role(auth.uid(), 'admin'::public.app_role) OR has_role(auth.uid(), 'moderator'::public.app_role));
  END IF;

  -- Update content
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='content_items' AND policyname='Admins and moderators can update content'
  ) THEN
    CREATE POLICY "Admins and moderators can update content"
    ON public.content_items
    FOR UPDATE
    USING (has_role(auth.uid(), 'admin'::public.app_role) OR has_role(auth.uid(), 'moderator'::public.app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::public.app_role) OR has_role(auth.uid(), 'moderator'::public.app_role));
  END IF;

  -- Delete content (admins only)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='content_items' AND policyname='Admins can delete content'
  ) THEN
    CREATE POLICY "Admins can delete content"
    ON public.content_items
    FOR DELETE
    USING (has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END $$;

-- Updated_at trigger
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_content_items_updated_at'
  ) THEN
    CREATE TRIGGER update_content_items_updated_at
    BEFORE UPDATE ON public.content_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 3) Site settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_mode boolean NOT NULL DEFAULT false,
  allow_registration boolean NOT NULL DEFAULT true,
  public_view_access boolean NOT NULL DEFAULT true,
  email_notifications boolean NOT NULL DEFAULT true,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Public can read settings
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='site_settings' AND policyname='Anyone can read site settings'
  ) THEN
    CREATE POLICY "Anyone can read site settings"
    ON public.site_settings
    FOR SELECT
    USING (true);
  END IF;

  -- Only admins can insert/update
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='site_settings' AND policyname='Admins manage site settings'
  ) THEN
    CREATE POLICY "Admins manage site settings"
    ON public.site_settings
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::public.app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_site_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 4) Global announcements
CREATE TABLE IF NOT EXISTS public.global_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  type public.announcement_kind NOT NULL DEFAULT 'info',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.global_announcements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Public can read announcements
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='global_announcements' AND policyname='Anyone can read global announcements'
  ) THEN
    CREATE POLICY "Anyone can read global announcements"
    ON public.global_announcements
    FOR SELECT
    USING (true);
  END IF;

  -- Admins can create/update/delete
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='global_announcements' AND policyname='Admins manage global announcements'
  ) THEN
    CREATE POLICY "Admins manage global announcements"
    ON public.global_announcements
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::public.app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END $$;