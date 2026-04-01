-- Fix: Insert missing roles for already-approved role_request modifications
-- User e063e963 (Ngazid) - had approved request but no role
INSERT INTO public.user_roles (user_id, role, assigned_by)
SELECT 'e063e963-0351-4885-b5c0-6523b4c1c1bd', 'annonceur'::app_role, '7f0ed50d-e024-4460-b9c3-c1f8107e76fb'
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = 'e063e963-0351-4885-b5c0-6523b4c1c1bd' AND role = 'annonceur'
);

-- User c5e4077e (farthink) - had approved request but no role
INSERT INTO public.user_roles (user_id, role, assigned_by)
SELECT 'c5e4077e-7e94-467a-a915-d7d5cd29f055', 'annonceur'::app_role, '7f0ed50d-e024-4460-b9c3-c1f8107e76fb'
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = 'c5e4077e-7e94-467a-a915-d7d5cd29f055' AND role = 'annonceur'
);
