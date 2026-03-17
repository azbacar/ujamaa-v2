-- ============================================
-- Freelancer Profiles (voluntary directory)
-- ============================================
CREATE TABLE public.freelancer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  bio text DEFAULT '',
  skills text[] DEFAULT '{}',
  hourly_rate_min numeric DEFAULT NULL,
  hourly_rate_max numeric DEFAULT NULL,
  currency text NOT NULL DEFAULT 'FC',
  experience_years integer DEFAULT 0,
  portfolio_url text DEFAULT NULL,
  island text DEFAULT NULL,
  location text DEFAULT NULL,
  is_available boolean NOT NULL DEFAULT true,
  is_visible boolean NOT NULL DEFAULT true,
  views integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.freelancer_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can see visible profiles
CREATE POLICY "Anyone can view visible freelancer profiles"
  ON public.freelancer_profiles FOR SELECT
  TO public
  USING (is_visible = true);

-- Authenticated users see own profile regardless
CREATE POLICY "Users can view own freelancer profile"
  ON public.freelancer_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Authenticated users can create their own profile
CREATE POLICY "Users can create own freelancer profile"
  ON public.freelancer_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own freelancer profile"
  ON public.freelancer_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own profile
CREATE POLICY "Users can delete own freelancer profile"
  ON public.freelancer_profiles FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can manage all profiles
CREATE POLICY "Admins manage all freelancer profiles"
  ON public.freelancer_profiles FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Deny anon
CREATE POLICY "freelancer_profiles_deny_anon"
  ON public.freelancer_profiles FOR ALL
  TO anon
  USING (false);

-- updated_at trigger
CREATE TRIGGER update_freelancer_profiles_updated_at
  BEFORE UPDATE ON public.freelancer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Direct Messages (internal messaging)
-- ============================================
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT no_self_message CHECK (sender_id <> receiver_id)
);

CREATE INDEX idx_dm_sender ON public.direct_messages(sender_id, created_at DESC);
CREATE INDEX idx_dm_receiver ON public.direct_messages(receiver_id, created_at DESC);
CREATE INDEX idx_dm_conversation ON public.direct_messages(
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id),
  created_at DESC
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Users can see messages they sent or received
CREATE POLICY "Users can view own messages"
  ON public.direct_messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Users can send messages
CREATE POLICY "Users can send messages"
  ON public.direct_messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Receivers can mark as read
CREATE POLICY "Receivers can update messages"
  ON public.direct_messages FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid());

-- Users can delete own sent messages
CREATE POLICY "Users can delete own sent messages"
  ON public.direct_messages FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- Admins can view all
CREATE POLICY "Admins manage all messages"
  ON public.direct_messages FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Deny anon
CREATE POLICY "direct_messages_deny_anon"
  ON public.direct_messages FOR ALL
  TO anon
  USING (false);

-- ============================================
-- RPC: Search freelancers by skills (for AI)
-- ============================================
CREATE OR REPLACE FUNCTION public.search_freelancers(_skills text[], _island text DEFAULT NULL, _limit integer DEFAULT 10)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  display_name text,
  bio text,
  skills text[],
  hourly_rate_min numeric,
  hourly_rate_max numeric,
  currency text,
  experience_years integer,
  island text,
  location text,
  is_available boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT fp.id, fp.user_id, fp.display_name, fp.bio, fp.skills,
         fp.hourly_rate_min, fp.hourly_rate_max, fp.currency,
         fp.experience_years, fp.island, fp.location, fp.is_available
  FROM public.freelancer_profiles fp
  WHERE fp.is_visible = true
    AND fp.is_available = true
    AND (
      _skills IS NULL
      OR array_length(_skills, 1) IS NULL
      OR fp.skills && _skills  -- array overlap operator
    )
    AND (_island IS NULL OR fp.island = _island)
  ORDER BY
    CASE WHEN _skills IS NOT NULL AND array_length(_skills, 1) IS NOT NULL
         THEN array_length(ARRAY(SELECT unnest(fp.skills) INTERSECT SELECT unnest(_skills)), 1)
         ELSE 0
    END DESC NULLS LAST,
    fp.created_at DESC
  LIMIT _limit;
$$;