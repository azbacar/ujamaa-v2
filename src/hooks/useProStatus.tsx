import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Hook centralisé pour le statut Pro GLOBAL.
 *
 * Règles produit (cf. PRODUCT UPDATE SPECIFICATION) :
 * - Pro est GLOBAL : tout user (normal, freelancer, entreprise, annonceur) peut être Pro.
 * - Pro est indépendant du rôle.
 * - Si je suis Pro → mes contacts sont visibles par tous.
 * - Si je suis Pro → je vois les contacts de tout le monde.
 * - Vérifié = badge gratuit/permanent, indépendant de Pro, débloque la géoloc publique.
 */
export function useProStatus() {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [canShareLocation, setCanShareLocation] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsPro(false);
      setIsVerified(false);
      setCanShareLocation(false);
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const [proRes, verifiedRes, locRes] = await Promise.all([
          supabase.rpc('is_pro_user', { _user_id: user.id }),
          supabase.rpc('is_verified_user', { _user_id: user.id }),
          supabase.rpc('can_share_public_location', { _user_id: user.id }),
        ]);
        setIsPro(!!proRes.data);
        setIsVerified(!!verifiedRes.data);
        setCanShareLocation(!!locRes.data);
      } catch {
        setIsPro(false);
        setIsVerified(false);
        setCanShareLocation(false);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [user]);

  return { isPro, isVerified, canShareLocation, loading };
}
