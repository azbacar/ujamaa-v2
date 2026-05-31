-- Restore anon SELECT on non-sensitive freelancer columns (whatsapp stays REVOKEd)
GRANT SELECT (
  id, user_id, display_name, bio, skills, hourly_rate_min, hourly_rate_max,
  currency, experience_years, portfolio_url, island, location,
  is_available, is_visible, views, avatar_url,
  facebook_url, linkedin_url, twitter_url, instagram_url,
  created_at, updated_at
) ON public.freelancer_profiles TO anon;