
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS native_token text;

ALTER TABLE public.push_subscriptions
  ALTER COLUMN endpoint DROP NOT NULL,
  ALTER COLUMN p256dh DROP NOT NULL,
  ALTER COLUMN auth DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_native_token_uniq
  ON public.push_subscriptions(user_id, native_token)
  WHERE native_token IS NOT NULL;

ALTER TABLE public.push_subscriptions
  DROP CONSTRAINT IF EXISTS push_subscriptions_payload_check;
ALTER TABLE public.push_subscriptions
  ADD CONSTRAINT push_subscriptions_payload_check
  CHECK (
    (platform = 'web' AND endpoint IS NOT NULL AND p256dh IS NOT NULL AND auth IS NOT NULL)
    OR (platform IN ('ios','android') AND native_token IS NOT NULL)
  );

ALTER TABLE public.tender_submissions REPLICA IDENTITY FULL;
ALTER TABLE public.diaspora_projects REPLICA IDENTITY FULL;

DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.tender_submissions;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.diaspora_projects;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
