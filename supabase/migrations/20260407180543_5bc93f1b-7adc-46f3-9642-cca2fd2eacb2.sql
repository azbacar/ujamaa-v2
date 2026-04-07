
-- Create verification_requests table
CREATE TABLE public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('freelancer', 'announcer', 'project_carrier')),
  business_name text,
  document_type text NOT NULL,
  document_url text,
  additional_info text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own requests
CREATE POLICY "Users can submit verification requests"
  ON public.verification_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can view their own requests
CREATE POLICY "Users can view own verification requests"
  ON public.verification_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins and moderators can view all
CREATE POLICY "Staff can view all verification requests"
  ON public.verification_requests FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Admins and moderators can update
CREATE POLICY "Staff can update verification requests"
  ON public.verification_requests FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Deny anon
CREATE POLICY "verification_requests_deny_anon"
  ON public.verification_requests FOR ALL TO anon
  USING (false);

-- Updated_at trigger
CREATE TRIGGER update_verification_requests_updated_at
  BEFORE UPDATE ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for verification documents (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-documents', 'verification-documents', false);

-- Storage RLS: authenticated users can upload their own docs
CREATE POLICY "Users can upload verification documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verification-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can view their own docs
CREATE POLICY "Users can view own verification documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'verification-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Staff can view all verification docs
CREATE POLICY "Staff can view all verification documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'verification-documents' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)));
