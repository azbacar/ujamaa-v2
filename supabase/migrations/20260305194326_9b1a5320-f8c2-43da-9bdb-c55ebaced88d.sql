
CREATE TABLE public.homepage_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '📁',
  link text,
  featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.homepage_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active homepage categories"
  ON public.homepage_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage homepage categories"
  ON public.homepage_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default categories
INSERT INTO public.homepage_categories (title, description, icon, link, featured, is_active, sort_order) VALUES
  ('Prix & Marchés', 'Prix actualisés des produits alimentaires et biens de consommation dans tous les marchés', '💰', '/prix', true, true, 1),
  ('Appels d''Offres', 'Marchés publics, appels à projets et opportunités d''affaires', '📋', '/appels-offres', false, true, 2),
  ('Événements', 'Manifestations culturelles, cérémonies officielles et événements communautaires', '🎭', '/evenements', false, true, 3),
  ('Services Publics', 'Horaires, contacts et informations sur les administrations et services', '🏛️', '/services', false, true, 4),
  ('Transport', 'Horaires des liaisons, tarifs et informations de transport inter-îles', '🚢', NULL, false, true, 5),
  ('Santé', 'Services de santé, pharmacies de garde et informations médicales', '🏥', '/services', true, true, 6),
  ('Tourisme & Gastronomie', 'Restaurants, hôtels, hébergements et découverte gastronomique locale', '🏨', '/annonces?category=Tourisme%20%26%20Gastronomie', true, true, 7);
