import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

/**
 * useAIRealtimeRefresh
 *
 * Garantit que l'assistant IA travaille toujours sur des données fraîches.
 *
 * Stratégie en 3 couches (combinées) :
 *
 *  1. **Re-fetch session** : à chaque ouverture du chat (montage du composant qui
 *     utilise ce hook), on bump une version stockée en localStorage. L'edge
 *     function `ai-chat` reconstruit déjà sa base de connaissances à chaque
 *     appel, mais ce signal permet aux composants front (tanstack-query) de
 *     vider leurs caches locaux d'aperçu IA.
 *
 *  2. **Polling temps réel** : on s'abonne aux tables critiques
 *     (`prices`, `events`, `global_announcements`) via Supabase Realtime.
 *     Toute mutation invalide les caches React Query liés à l'IA et bump le
 *     compteur de version : le prochain message du chat repartira sur la
 *     dernière donnée.
 *
 *  3. **Warmup serveur** : voir le cron `ai_chat_warmup` (Postgres pg_cron)
 *     qui ping toutes les 5 min `/functions/v1/ai-chat?warmup=1`. Côté client
 *     ce hook n'a rien à faire pour cette couche.
 */
export const AI_CONTEXT_VERSION_KEY = "ai_context_version";

function bumpVersion() {
  try {
    const current = parseInt(localStorage.getItem(AI_CONTEXT_VERSION_KEY) || "0", 10);
    localStorage.setItem(AI_CONTEXT_VERSION_KEY, String(current + 1));
    window.dispatchEvent(new CustomEvent("ai-context-updated"));
  } catch {
    /* ignore (private mode, SSR…) */
  }
}

export function useAIRealtimeRefresh(enabled: boolean = true) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    // Couche 1 : re-fetch à l'ouverture
    bumpVersion();
    qc.invalidateQueries({ queryKey: ["ai-context"] });

    // Couche 2 : Realtime
    const channel = supabase
      .channel("ai-knowledge-watch")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "prices" },
        () => {
          bumpVersion();
          qc.invalidateQueries({ queryKey: ["ai-context"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "global_announcements" },
        () => {
          bumpVersion();
          qc.invalidateQueries({ queryKey: ["ai-context"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => {
          bumpVersion();
          qc.invalidateQueries({ queryKey: ["ai-context"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, qc]);
}

export function getAIContextVersion(): number {
  try {
    return parseInt(localStorage.getItem(AI_CONTEXT_VERSION_KEY) || "0", 10);
  } catch {
    return 0;
  }
}
