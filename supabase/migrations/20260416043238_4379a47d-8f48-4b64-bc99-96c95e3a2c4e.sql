ALTER TABLE public.gastronomy_items 
ADD COLUMN service_mode text DEFAULT NULL;

COMMENT ON COLUMN public.gastronomy_items.service_mode IS 'Restaurant service mode: sur-place, emporter, les-deux';