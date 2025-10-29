-- Create events table with comprehensive fields
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  full_content TEXT,
  category TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT NOT NULL,
  island TEXT NOT NULL,
  organizer TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  images TEXT[],
  price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'FC',
  capacity INTEGER,
  registered_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  requires_registration BOOLEAN DEFAULT true,
  requires_payment BOOLEAN DEFAULT false,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  views INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create event_registrations table
CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'attended')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_amount NUMERIC,
  ticket_code TEXT UNIQUE,
  additional_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Create notifications table for real-time notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  read BOOLEAN DEFAULT false,
  link TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Anyone can view published events"
  ON public.events FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins and moderators can manage all events"
  ON public.events FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Authors can view their own events"
  ON public.events FOR SELECT
  USING (author_id = auth.uid());

CREATE POLICY "Authors can update their own events"
  ON public.events FOR UPDATE
  USING (author_id = auth.uid());

-- RLS Policies for registrations
CREATE POLICY "Users can view their own registrations"
  ON public.event_registrations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own registrations"
  ON public.event_registrations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own registrations"
  ON public.event_registrations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all registrations"
  ON public.event_registrations FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all notifications"
  ON public.notifications FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_events_island ON public.events(island);
CREATE INDEX idx_events_category ON public.events(category);
CREATE INDEX idx_event_registrations_user ON public.event_registrations(user_id);
CREATE INDEX idx_event_registrations_event ON public.event_registrations(event_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_created ON public.notifications(created_at);

-- Trigger for updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at
  BEFORE UPDATE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique ticket code
CREATE OR REPLACE FUNCTION generate_ticket_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := 'TKT-' || upper(substr(md5(random()::text), 1, 8));
    SELECT EXISTS(SELECT 1 FROM public.event_registrations WHERE ticket_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket code
CREATE OR REPLACE FUNCTION set_ticket_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_code IS NULL THEN
    NEW.ticket_code := generate_ticket_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_ticket_code_trigger
  BEFORE INSERT ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_code();

-- Function to update registered_count
CREATE OR REPLACE FUNCTION update_event_registered_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.events 
    SET registered_count = registered_count + 1 
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.events 
    SET registered_count = GREATEST(0, registered_count - 1)
    WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_registered_count_trigger
  AFTER INSERT OR DELETE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_event_registered_count();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;