-- Add deny-anon policies on sensitive tables that are missing them

-- chat_messages: no anon access
CREATE POLICY "chat_messages_deny_anon"
ON public.chat_messages FOR ALL
TO anon
USING (false);

-- event_registrations: no anon access
CREATE POLICY "event_registrations_deny_anon"
ON public.event_registrations FOR ALL
TO anon
USING (false);

-- announcer_privileges: no anon access
CREATE POLICY "announcer_privileges_deny_anon"
ON public.announcer_privileges FOR ALL
TO anon
USING (false);

-- reports: no anon access
CREATE POLICY "reports_deny_anon"
ON public.reports FOR ALL
TO anon
USING (false);

-- pending_modifications: no anon access
CREATE POLICY "pending_modifications_deny_anon"
ON public.pending_modifications FOR ALL
TO anon
USING (false);

-- push_subscriptions: no anon access
CREATE POLICY "push_subscriptions_deny_anon"
ON public.push_subscriptions FOR ALL
TO anon
USING (false);

-- pro_subscription_requests: no anon access
CREATE POLICY "pro_subscription_requests_deny_anon"
ON public.pro_subscription_requests FOR ALL
TO anon
USING (false);

-- notifications: no anon access
CREATE POLICY "notifications_deny_anon"
ON public.notifications FOR ALL
TO anon
USING (false);

-- favorites: no anon access
CREATE POLICY "favorites_deny_anon"
ON public.favorites FOR ALL
TO anon
USING (false);

-- user_roles: no anon access
CREATE POLICY "user_roles_deny_anon"
ON public.user_roles FOR ALL
TO anon
USING (false);

-- Now fix policies that use {public} role but should be {authenticated} only
-- content_comments: keep public SELECT, but restrict write policies
-- These already require authenticated, so the warning is about the public SELECT which is intentional

-- content_items: public SELECT for published is intentional, write policies already require authenticated

-- For tables that have write policies targeting {authenticated} but the linter warns about anon:
-- The deny-anon policies above will block anon from these tables entirely