-- Fix security warnings by setting search_path for functions

-- Fix search path for existing functions
ALTER FUNCTION public.has_role(_user_id uuid, _role app_role) SET search_path = 'public';
ALTER FUNCTION public.get_user_role(_user_id uuid) SET search_path = 'public'; 
ALTER FUNCTION public.log_admin_action(_action_type text, _target_type text, _target_id uuid, _description text, _metadata jsonb) SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';