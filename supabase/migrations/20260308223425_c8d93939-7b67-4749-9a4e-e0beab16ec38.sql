
-- =============================================
-- FIX 1: gastronomy_items - Remove broken INSERT policy
-- Any authenticated user can currently insert due to OR (auth.uid() IS NOT NULL)
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can create gastronomy items" ON public.gastronomy_items;
CREATE POLICY "Annonceurs and admins can create gastronomy items"
ON public.gastronomy_items
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = author_id
  AND (
    has_role(auth.uid(), 'annonceur'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'moderator'::app_role)
  )
);

-- =============================================
-- FIX 2: content_items - Annonceurs can self-publish bypassing moderation
-- Add status = 'draft' constraint to WITH CHECK
-- =============================================
DROP POLICY IF EXISTS "Annonceurs can update own draft content" ON public.content_items;
CREATE POLICY "Annonceurs can update own draft content"
ON public.content_items
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'annonceur'::app_role)
  AND author_id = auth.uid()
  AND status = 'draft'::content_status
)
WITH CHECK (
  has_role(auth.uid(), 'annonceur'::app_role)
  AND author_id = auth.uid()
  AND status = 'draft'::content_status
);

-- =============================================
-- FIX 3: events - Authors can self-publish bypassing moderation
-- Restrict authors to only update their own draft events
-- =============================================
DROP POLICY IF EXISTS "Authors can update their own events" ON public.events;
CREATE POLICY "Authors can update their own draft events"
ON public.events
FOR UPDATE
TO authenticated
USING (
  author_id = auth.uid()
  AND status = 'draft'
)
WITH CHECK (
  author_id = auth.uid()
  AND status = 'draft'
);

-- =============================================
-- FIX 4: Restrict all non-public policies to 'authenticated' role
-- This prevents anonymous users from matching role-based policies
-- =============================================

-- admin_actions
DROP POLICY IF EXISTS "admin_actions_admin_insert" ON public.admin_actions;
CREATE POLICY "admin_actions_admin_insert" ON public.admin_actions FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND admin_id = auth.uid());

DROP POLICY IF EXISTS "admin_actions_admin_select" ON public.admin_actions;
CREATE POLICY "admin_actions_admin_select" ON public.admin_actions FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- ads
DROP POLICY IF EXISTS "Admins can manage all ads" ON public.ads;
CREATE POLICY "Admins can manage all ads" ON public.ads FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ai_conversations
DROP POLICY IF EXISTS "conversations_user_delete_own" ON public.ai_conversations;
CREATE POLICY "conversations_user_delete_own" ON public.ai_conversations FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "conversations_user_select_own" ON public.ai_conversations;
CREATE POLICY "conversations_user_select_own" ON public.ai_conversations FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "conversations_user_update_own" ON public.ai_conversations;
CREATE POLICY "conversations_user_update_own" ON public.ai_conversations FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "conversations_user_insert_own" ON public.ai_conversations;
CREATE POLICY "conversations_user_insert_own" ON public.ai_conversations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ai_knowledge_sources
DROP POLICY IF EXISTS "Admins can manage ai_knowledge_sources" ON public.ai_knowledge_sources;
CREATE POLICY "Admins can manage ai_knowledge_sources" ON public.ai_knowledge_sources FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- announcer_privileges
DROP POLICY IF EXISTS "Admins can manage all privileges" ON public.announcer_privileges;
CREATE POLICY "Admins can manage all privileges" ON public.announcer_privileges FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view own privileges" ON public.announcer_privileges;
CREATE POLICY "Users can view own privileges" ON public.announcer_privileges FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- chat_messages
DROP POLICY IF EXISTS "Admins can view all chat messages" ON public.chat_messages;
CREATE POLICY "Admins can view all chat messages" ON public.chat_messages FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can delete their own chat messages" ON public.chat_messages;
CREATE POLICY "Users can delete their own chat messages" ON public.chat_messages FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own chat messages" ON public.chat_messages;
CREATE POLICY "Users can insert their own chat messages" ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own chat messages" ON public.chat_messages;
CREATE POLICY "Users can view their own chat messages" ON public.chat_messages FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- comments
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments" ON public.comments FOR INSERT TO authenticated
WITH CHECK ((auth.uid())::text = (author_id)::text);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE TO authenticated
USING ((auth.uid())::text = (author_id)::text);

DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE TO authenticated
USING ((auth.uid())::text = (author_id)::text)
WITH CHECK ((auth.uid())::text = (author_id)::text);

-- content_comments
DROP POLICY IF EXISTS "Admins and moderators can delete any comment" ON public.content_comments;
CREATE POLICY "Admins and moderators can delete any comment" ON public.content_comments FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

DROP POLICY IF EXISTS "Authenticated users can insert own comments" ON public.content_comments;
CREATE POLICY "Authenticated users can insert own comments" ON public.content_comments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.content_comments;
CREATE POLICY "Users can delete own comments" ON public.content_comments FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON public.content_comments;
CREATE POLICY "Users can update own comments" ON public.content_comments FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- content_items (non-public policies)
DROP POLICY IF EXISTS "Admins and moderators can create content" ON public.content_items;
CREATE POLICY "Admins and moderators can create content" ON public.content_items FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

DROP POLICY IF EXISTS "Admins and moderators can update content" ON public.content_items;
CREATE POLICY "Admins and moderators can update content" ON public.content_items FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

DROP POLICY IF EXISTS "Admins and moderators can view all content" ON public.content_items;
CREATE POLICY "Admins and moderators can view all content" ON public.content_items FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

DROP POLICY IF EXISTS "Admins can delete content" ON public.content_items;
CREATE POLICY "Admins can delete content" ON public.content_items FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Annonceurs can insert own content as draft" ON public.content_items;
CREATE POLICY "Annonceurs can insert own content as draft" ON public.content_items FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'annonceur'::app_role) AND author_id = auth.uid() AND status = 'draft'::content_status);

DROP POLICY IF EXISTS "Annonceurs can view own content" ON public.content_items;
CREATE POLICY "Annonceurs can view own content" ON public.content_items FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'annonceur'::app_role) AND author_id = auth.uid());

-- event_registrations
DROP POLICY IF EXISTS "Admins can view all registrations" ON public.event_registrations;
CREATE POLICY "Admins can view all registrations" ON public.event_registrations FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

DROP POLICY IF EXISTS "Users can create their own registrations" ON public.event_registrations;
CREATE POLICY "Users can create their own registrations" ON public.event_registrations FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own registrations" ON public.event_registrations;
CREATE POLICY "Users can update their own registrations" ON public.event_registrations FOR UPDATE TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own registrations" ON public.event_registrations;
CREATE POLICY "Users can view their own registrations" ON public.event_registrations FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- events (non-public policies)
DROP POLICY IF EXISTS "Admins and moderators can manage all events" ON public.events;
CREATE POLICY "Admins and moderators can manage all events" ON public.events FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

DROP POLICY IF EXISTS "Annonceurs can create own events" ON public.events;
CREATE POLICY "Annonceurs can create own events" ON public.events FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'annonceur'::app_role) AND author_id = auth.uid());

DROP POLICY IF EXISTS "Annonceurs can delete own draft events" ON public.events;
CREATE POLICY "Annonceurs can delete own draft events" ON public.events FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'annonceur'::app_role) AND author_id = auth.uid() AND status = 'draft');

DROP POLICY IF EXISTS "Authors can view their own events" ON public.events;
CREATE POLICY "Authors can view their own events" ON public.events FOR SELECT TO authenticated
USING (author_id = auth.uid());

-- favorites
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
CREATE POLICY "Users can manage own favorites" ON public.favorites FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- gastronomy_items (non-public)
DROP POLICY IF EXISTS "Admins and moderators can view all gastronomy items" ON public.gastronomy_items;
CREATE POLICY "Admins and moderators can view all gastronomy items" ON public.gastronomy_items FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

DROP POLICY IF EXISTS "Admins can manage all gastronomy items" ON public.gastronomy_items;
CREATE POLICY "Admins can manage all gastronomy items" ON public.gastronomy_items FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Annonceurs can delete their own gastronomy items" ON public.gastronomy_items;
CREATE POLICY "Annonceurs can delete their own gastronomy items" ON public.gastronomy_items FOR DELETE TO authenticated
USING ((has_role(auth.uid(), 'annonceur'::app_role) AND author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Annonceurs can update their own gastronomy items" ON public.gastronomy_items;
CREATE POLICY "Annonceurs can update their own gastronomy items" ON public.gastronomy_items FOR UPDATE TO authenticated
USING ((has_role(auth.uid(), 'annonceur'::app_role) AND author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK ((has_role(auth.uid(), 'annonceur'::app_role) AND author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

DROP POLICY IF EXISTS "Annonceurs can view their own gastronomy items" ON public.gastronomy_items;
CREATE POLICY "Annonceurs can view their own gastronomy items" ON public.gastronomy_items FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'annonceur'::app_role) AND author_id = auth.uid());

-- global_announcements
DROP POLICY IF EXISTS "Admins manage global announcements" ON public.global_announcements;
CREATE POLICY "Admins manage global announcements" ON public.global_announcements FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- homepage_categories
DROP POLICY IF EXISTS "Admins can manage homepage categories" ON public.homepage_categories;
CREATE POLICY "Admins can manage homepage categories" ON public.homepage_categories FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- homepage_sections
DROP POLICY IF EXISTS "Admins can manage homepage sections" ON public.homepage_sections;
CREATE POLICY "Admins can manage homepage sections" ON public.homepage_sections FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- notifications
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;
CREATE POLICY "Admins can manage all notifications" ON public.notifications FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL);

-- pending_modifications
DROP POLICY IF EXISTS "Authenticated users can submit modifications" ON public.pending_modifications;
CREATE POLICY "Authenticated users can submit modifications" ON public.pending_modifications FOR INSERT TO authenticated
WITH CHECK (submitted_by = auth.uid());

DROP POLICY IF EXISTS "Moderators and admins can update modifications" ON public.pending_modifications;
CREATE POLICY "Moderators and admins can update modifications" ON public.pending_modifications FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'moderator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Moderators and admins can view all pending modifications" ON public.pending_modifications;
CREATE POLICY "Moderators and admins can view all pending modifications" ON public.pending_modifications FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view their own submissions" ON public.pending_modifications;
CREATE POLICY "Users can view their own submissions" ON public.pending_modifications FOR SELECT TO authenticated
USING (submitted_by = auth.uid());

-- posts
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
CREATE POLICY "Authenticated users can create posts" ON public.posts FOR INSERT TO authenticated
WITH CHECK ((auth.uid())::text = (author_id)::text);

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE TO authenticated
USING ((auth.uid())::text = (author_id)::text);

DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE TO authenticated
USING ((auth.uid())::text = (author_id)::text)
WITH CHECK ((auth.uid())::text = (author_id)::text);

-- prices
DROP POLICY IF EXISTS "Les admins peuvent tout gérer" ON public.prices;
CREATE POLICY "Les admins peuvent tout gérer" ON public.prices FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent créer des prix" ON public.prices;
CREATE POLICY "Les utilisateurs authentifiés peuvent créer des prix" ON public.prices FOR INSERT TO authenticated
WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leurs propres prix" ON public.prices;
CREATE POLICY "Les utilisateurs peuvent modifier leurs propres prix" ON public.prices FOR UPDATE TO authenticated
USING (auth.uid() = author_id);

-- pro_subscription_requests
DROP POLICY IF EXISTS "Admins and moderators can update" ON public.pro_subscription_requests;
CREATE POLICY "Admins and moderators can update" ON public.pro_subscription_requests FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

DROP POLICY IF EXISTS "Admins and moderators can view all" ON public.pro_subscription_requests;
CREATE POLICY "Admins and moderators can view all" ON public.pro_subscription_requests FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

DROP POLICY IF EXISTS "Users can insert own requests" ON public.pro_subscription_requests;
CREATE POLICY "Users can insert own requests" ON public.pro_subscription_requests FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own requests" ON public.pro_subscription_requests;
CREATE POLICY "Users can view own requests" ON public.pro_subscription_requests FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- push_subscriptions
DROP POLICY IF EXISTS "Admins can read all push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Admins can read all push subscriptions" ON public.push_subscriptions FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete own push subscriptions" ON public.push_subscriptions FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can insert own push subscriptions" ON public.push_subscriptions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can update own push subscriptions" ON public.push_subscriptions FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view own push subscriptions" ON public.push_subscriptions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- reports
DROP POLICY IF EXISTS "Admins and moderators can update reports" ON public.reports;
CREATE POLICY "Admins and moderators can update reports" ON public.reports FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

DROP POLICY IF EXISTS "Admins and moderators can view all reports" ON public.reports;
CREATE POLICY "Admins and moderators can view all reports" ON public.reports FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

DROP POLICY IF EXISTS "Authenticated users can insert own reports" ON public.reports;
CREATE POLICY "Authenticated users can insert own reports" ON public.reports FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
CREATE POLICY "Users can view own reports" ON public.reports FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- site_analytics
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.site_analytics;
CREATE POLICY "Admins can view all analytics" ON public.site_analytics FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "site_analytics_deny_non_admin_access" ON public.site_analytics;
CREATE POLICY "site_analytics_deny_non_admin_access" ON public.site_analytics FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- site_settings
DROP POLICY IF EXISTS "Admins manage site settings" ON public.site_settings;
CREATE POLICY "Admins manage site settings" ON public.site_settings FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- static_pages
DROP POLICY IF EXISTS "Admins can insert static pages" ON public.static_pages;
CREATE POLICY "Admins can insert static pages" ON public.static_pages FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update static pages" ON public.static_pages;
CREATE POLICY "Admins can update static pages" ON public.static_pages FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));

-- user_roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- users
DROP POLICY IF EXISTS "users_admin_select_all" ON public.users;
CREATE POLICY "users_admin_select_all" ON public.users FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "users_authenticated_insert_own" ON public.users;
CREATE POLICY "users_authenticated_insert_own" ON public.users FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_authenticated_select_own" ON public.users;
CREATE POLICY "users_authenticated_select_own" ON public.users FOR SELECT TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_authenticated_update_own" ON public.users;
CREATE POLICY "users_authenticated_update_own" ON public.users FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
