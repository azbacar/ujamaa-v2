
-- 1. Enrichir gastronomy_items avec géolocalisation et métadonnées tourisme
ALTER TABLE public.gastronomy_items
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS geo_expires_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS dining_style text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS accommodation_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS room_types jsonb DEFAULT '[]'::jsonb;

-- 2. Table des éléments de menu restaurant
CREATE TABLE public.restaurant_menu_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gastronomy_item_id uuid NOT NULL REFERENCES public.gastronomy_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'FC',
  image_url text,
  category text DEFAULT 'plat',
  is_available boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.restaurant_menu_items ENABLE ROW LEVEL SECURITY;

-- Public peut voir les menus des restaurants publiés
CREATE POLICY "menu_items_public_read" ON public.restaurant_menu_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.gastronomy_items gi
      WHERE gi.id = restaurant_menu_items.gastronomy_item_id
        AND gi.status = 'published'
    )
  );

-- Les auteurs du restaurant peuvent gérer leurs menus
CREATE POLICY "menu_items_author_all" ON public.restaurant_menu_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.gastronomy_items gi
      WHERE gi.id = restaurant_menu_items.gastronomy_item_id
        AND gi.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gastronomy_items gi
      WHERE gi.id = restaurant_menu_items.gastronomy_item_id
        AND gi.author_id = auth.uid()
    )
  );

-- Admins/modérateurs contrôle total
CREATE POLICY "menu_items_admin" ON public.restaurant_menu_items
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Deny anon writes
CREATE POLICY "menu_items_deny_anon" ON public.restaurant_menu_items
  FOR ALL TO anon USING (false);

-- Trigger updated_at
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.restaurant_menu_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Table des ingrédients de recettes
CREATE TABLE public.recipe_ingredients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gastronomy_item_id uuid NOT NULL REFERENCES public.gastronomy_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Public peut voir les ingrédients des recettes publiées
CREATE POLICY "ingredients_public_read" ON public.recipe_ingredients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.gastronomy_items gi
      WHERE gi.id = recipe_ingredients.gastronomy_item_id
        AND gi.status = 'published'
    )
  );

-- Les auteurs peuvent gérer les ingrédients
CREATE POLICY "ingredients_author_all" ON public.recipe_ingredients
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.gastronomy_items gi
      WHERE gi.id = recipe_ingredients.gastronomy_item_id
        AND gi.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gastronomy_items gi
      WHERE gi.id = recipe_ingredients.gastronomy_item_id
        AND gi.author_id = auth.uid()
    )
  );

-- Admins/modérateurs contrôle total
CREATE POLICY "ingredients_admin" ON public.recipe_ingredients
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Deny anon writes
CREATE POLICY "ingredients_deny_anon" ON public.recipe_ingredients
  FOR ALL TO anon USING (false);

-- 4. Bucket pour images de menus
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Politiques storage menu-images
CREATE POLICY "menu_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'menu-images');

CREATE POLICY "menu_images_auth_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'menu-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "menu_images_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'menu-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "menu_images_auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'menu-images' AND auth.uid()::text = (storage.foldername(name))[1]);
