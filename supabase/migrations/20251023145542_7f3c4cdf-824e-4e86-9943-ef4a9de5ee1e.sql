-- Créer la table des prix avec structure géographique détaillée
CREATE TABLE IF NOT EXISTS public.prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'FC',
  unit TEXT NOT NULL,
  vendor TEXT NOT NULL,
  market TEXT NOT NULL,
  village TEXT,
  city TEXT NOT NULL,
  region TEXT,
  island TEXT NOT NULL,
  trend TEXT CHECK (trend IN ('up', 'down', 'stable')) DEFAULT 'stable',
  author_id UUID NOT NULL,
  status content_status NOT NULL DEFAULT 'published',
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur la table prices
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour prices
CREATE POLICY "Tout le monde peut voir les prix publiés"
  ON public.prices
  FOR SELECT
  USING (status = 'published');

CREATE POLICY "Les utilisateurs authentifiés peuvent créer des prix"
  ON public.prices
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs propres prix"
  ON public.prices
  FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Les admins peuvent tout gérer"
  ON public.prices
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_prices_updated_at
  BEFORE UPDATE ON public.prices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX idx_prices_island ON public.prices(island);
CREATE INDEX idx_prices_category ON public.prices(category);
CREATE INDEX idx_prices_status ON public.prices(status);
CREATE INDEX idx_prices_created_at ON public.prices(created_at DESC);