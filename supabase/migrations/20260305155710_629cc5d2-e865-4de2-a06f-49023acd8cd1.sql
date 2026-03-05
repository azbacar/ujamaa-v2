
CREATE TABLE public.ai_knowledge_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  description text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.ai_knowledge_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ai_knowledge_sources"
  ON public.ai_knowledge_sources FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read active ai_knowledge_sources"
  ON public.ai_knowledge_sources FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
