-- Fix 1: site_settings_public view used security_definer (linter error). Switch to security_invoker.
ALTER VIEW public.site_settings_public SET (security_invoker = true);

-- Fix 2: tender_submissions broadcast via Realtime leaks PII because realtime.messages has no RLS.
-- Remove the table from the realtime publication. Submission notifications go through
-- the dedicated `notifications` table + edge function (notify-tender-submission), so realtime broadcasts
-- of the raw row are unnecessary and exposed sensitive business data to any authenticated subscriber.
ALTER PUBLICATION supabase_realtime DROP TABLE public.tender_submissions;