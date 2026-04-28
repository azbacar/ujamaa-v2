import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Récupère le statut Pro d'un auteur (de publication) à partir de son user_id.
 * Utilisé pour décider si on affiche les contacts publiquement sur ses publications.
 *
 * Règle produit : si l'auteur est Pro, ses contacts sont visibles par TOUT LE MONDE.
 *
 * Cache 5 min pour éviter les requêtes en rafale sur les listes.
 */
export function useAuthorProStatus(authorId?: string | null) {
  return useQuery({
    queryKey: ['author-pro-status', authorId],
    enabled: !!authorId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!authorId) return false;
      const { data, error } = await supabase
        .from('users_pro_status')
        .select('is_pro')
        .eq('id', authorId)
        .maybeSingle();
      if (error) return false;
      return !!data?.is_pro;
    },
  });
}

/**
 * Variante batch — récupère le statut Pro de plusieurs auteurs en une requête.
 * Utile pour les listes (cards de prix, événements, etc.).
 */
export function useAuthorsProStatus(authorIds: string[]) {
  const sortedIds = [...new Set(authorIds.filter(Boolean))].sort();
  return useQuery({
    queryKey: ['authors-pro-status', sortedIds],
    enabled: sortedIds.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users_pro_status')
        .select('id, is_pro')
        .in('id', sortedIds);
      if (error) return new Map<string, boolean>();
      const map = new Map<string, boolean>();
      (data || []).forEach((row: any) => map.set(row.id, !!row.is_pro));
      return map;
    },
  });
}
