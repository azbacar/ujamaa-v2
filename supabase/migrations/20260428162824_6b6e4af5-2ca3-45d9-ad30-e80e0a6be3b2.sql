-- Enable pg_cron for scheduled AI warmup
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Drop existing job if any (idempotent)
DO $$
BEGIN
  PERFORM cron.unschedule('ai_chat_warmup');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Schedule AI knowledge cache warmup every 5 minutes.
-- Hits the public /warmup endpoint of mobile-api which forwards a no-op
-- ping to ai-chat so the in-memory dynamic site data gets refreshed
-- and the model stays "warm".
SELECT cron.schedule(
  'ai_chat_warmup',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://vpibvgdpeiicczelbynf.supabase.co/functions/v1/mobile-api/warmup',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);