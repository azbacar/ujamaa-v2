import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Écoute l'événement global `ujamaan:dataset-stale` (émis par
 * `validateDatasetCoherence`) et invalide les caches React Query
 * correspondants pour forcer un re-fetch propre.
 *
 * À monter une seule fois, près de la racine de l'app.
 */
export function useDatasetStaleListener() {
  const qc = useQueryClient();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { key?: string; reason?: string } | undefined;
      if (!detail?.key) return;
      // Invalide le cache React Query lié à ce dataset
      qc.invalidateQueries({ queryKey: [detail.key] });
      qc.invalidateQueries({ queryKey: ['ai-context'] });
      // Log discret pour le debug terrain (visible Safari Dev Tools)
      // eslint-disable-next-line no-console
      console.info('[Ujamaan] dataset stale →', detail.key, detail.reason);
    };
    window.addEventListener('ujamaan:dataset-stale', handler);
    return () => window.removeEventListener('ujamaan:dataset-stale', handler);
  }, [qc]);
}
