-- Enable pg_net extension for HTTP calls from triggers
create extension if not exists pg_net with schema extensions;

-- Trigger function: notify when an event is published
create or replace function public.notify_event_published()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only trigger when status changes to 'published'
  if NEW.status = 'published' and (TG_OP = 'INSERT' or OLD.status is distinct from 'published') then
    -- Insert broadcast notification
    insert into public.notifications (title, message, type, link)
    values (
      '🎉 Nouvel événement',
      NEW.title,
      'event',
      '/evenements/' || NEW.id::text
    );

    -- Call edge function via pg_net
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
$$;

-- Trigger function: notify when an urgent announcement is created
create or replace function public.notify_urgent_announcement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.type = 'urgent' then
    -- Insert broadcast notification
    insert into public.notifications (title, message, type, link)
    values (
      '🚨 Alerte urgente',
      NEW.title || ' - ' || NEW.content,
      'urgent',
      '/'
    );

    -- Call edge function via pg_net
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
$$;

-- Create triggers
create trigger on_event_published
  after insert or update on public.events
  for each row
  execute function public.notify_event_published();

create trigger on_urgent_announcement
  after insert on public.global_announcements
  for each row
  execute function public.notify_urgent_announcement();

-- Allow annonceurs to create events (as draft for moderation)
create policy "Annonceurs can create own events"
  on public.events
  for insert
  to authenticated
  with check (
    has_role(auth.uid(), 'annonceur'::app_role)
    and author_id = auth.uid()
  );

-- Allow annonceurs to delete their own draft events
create policy "Annonceurs can delete own draft events"
  on public.events
  for delete
  to authenticated
  using (
    has_role(auth.uid(), 'annonceur'::app_role)
    and author_id = auth.uid()
    and status = 'draft'
  );
