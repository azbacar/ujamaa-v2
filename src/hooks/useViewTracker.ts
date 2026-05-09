import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ViewableType = 'content_item' | 'event' | 'invest' | 'freelance_job' | 'price';

/**
 * Incrémente atomiquement le compteur de vues côté serveur.
 * Une seule incrémentation par (type, id) par session de navigation grâce à sessionStorage.
 */
export function useViewTracker(type: ViewableType, id: string | undefined | null) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!id || tracked.current) return;
    const key = `view:${type}:${id}`;
    if (sessionStorage.getItem(key)) return;

    tracked.current = true;
    sessionStorage.setItem(key, '1');

    supabase.rpc('increment_content_view', { _type: type, _id: id }).then(({ error }) => {
      if (error) {
        console.warn('[viewTracker] increment failed', type, id, error);
        sessionStorage.removeItem(key);
        tracked.current = false;
      }
    });
  }, [type, id]);
}
