-- 1. Fix: synchroniser azbacar (demande approuvée mais account_type pas mis à jour)
UPDATE public.users
SET account_type = 'pro'
WHERE id = 'ce5a5a92-3537-46ef-9ffb-ae6fde47ef1a'
  AND EXISTS (
    SELECT 1 FROM public.pro_subscription_requests
    WHERE user_id = 'ce5a5a92-3537-46ef-9ffb-ae6fde47ef1a' AND status = 'approved'
  );

-- S'assurer que le rôle annonceur est bien attribué
INSERT INTO public.user_roles (user_id, role)
SELECT 'ce5a5a92-3537-46ef-9ffb-ae6fde47ef1a'::uuid, 'annonceur'::app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = 'ce5a5a92-3537-46ef-9ffb-ae6fde47ef1a' AND role = 'annonceur'
);

-- 2. Trigger: synchroniser automatiquement account_type='pro' quand une demande est approuvée
CREATE OR REPLACE FUNCTION public.sync_pro_subscription_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Quand une demande passe à 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    -- Mettre à jour account_type
    UPDATE public.users
    SET account_type = 'pro'
    WHERE id = NEW.user_id;

    -- Garantir le rôle annonceur
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'annonceur'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Si on rétrograde (rejected après approved), retirer le statut pro uniquement si plus aucune demande approuvée active
  IF NEW.status = 'rejected' AND OLD.status = 'approved' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.pro_subscription_requests
      WHERE user_id = NEW.user_id AND status = 'approved' AND id <> NEW.id
    ) THEN
      UPDATE public.users SET account_type = 'free' WHERE id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_pro_subscription_approval ON public.pro_subscription_requests;
CREATE TRIGGER trg_sync_pro_subscription_approval
AFTER UPDATE OF status ON public.pro_subscription_requests
FOR EACH ROW
EXECUTE FUNCTION public.sync_pro_subscription_approval();