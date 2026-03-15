
-- Fix the notify_event_published trigger to use valid notification type
CREATE OR REPLACE FUNCTION public.notify_event_published()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if NEW.status = 'published' and (TG_OP = 'INSERT' or OLD.status is distinct from 'published') then
    insert into public.notifications (title, message, type, link)
    values (
      '🎉 Nouvel événement',
      NEW.title,
      'info',
      '/evenements/' || NEW.id::text
    );

    perform net.http_post(
      url := 'https://vpibvgdpeiicczelbynf.supabase.co/functions/v1/notify-broadcast',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwaWJ2Z2RwZWlpY2N6ZWxieW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTQ2NDAsImV4cCI6MjA2Nzc5MDY0MH0.BMSjW20JV-khx-_JOHAIsonKci5pqXnt2cr8p_HWIwk"}'::jsonb,
      body := jsonb_build_object(
        'title', '🎉 Nouvel événement : ' || NEW.title,
        'body', coalesce(NEW.description, NEW.title),
        'url', '/evenements/' || NEW.id::text
      )
    );
  end if;
  return NEW;
end;
$function$;

-- Also fix notify_urgent_announcement which uses 'urgent' (also invalid)
CREATE OR REPLACE FUNCTION public.notify_urgent_announcement()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if NEW.type = 'urgent' then
    insert into public.notifications (title, message, type, link)
    values (
      '🚨 Alerte urgente',
      NEW.title || ' - ' || NEW.content,
      'error',
      '/'
    );

    perform net.http_post(
      url := 'https://vpibvgdpeiicczelbynf.supabase.co/functions/v1/notify-broadcast',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwaWJ2Z2RwZWlpY2N6ZWxieW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTQ2NDAsImV4cCI6MjA2Nzc5MDY0MH0.BMSjW20JV-khx-_JOHAIsonKci5pqXnt2cr8p_HWIwk"}'::jsonb,
      body := jsonb_build_object(
        'title', '🚨 ' || NEW.title,
        'body', NEW.content,
        'url', '/'
      )
    );
  end if;
  return NEW;
end;
$function$;
