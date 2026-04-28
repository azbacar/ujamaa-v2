/**
 * Dataset checksum / version validation
 * ------------------------------------------------------------
 * Garantit que les listes affichées (prix, événements, …) correspondent bien
 * à la dernière version reçue après un refresh ou un bump de version d'app.
 *
 * Principe :
 *   1. À chaque fetch d'un dataset on calcule un checksum stable basé sur les
 *      paires (id, updated_at|created_at).
 *   2. On stocke ce checksum + la version de l'app dans `sessionStorage`.
 *   3. Après un refresh (ou un changement de `__APP_VERSION__`) on re-fetch
 *      et on compare. Si le checksum diffère, on émet l'événement
 *      `ujamaan:dataset-stale` et on invalide les caches React Query.
 *
 * 100% safe sur Safari iOS privé : tout passe par `safeStorage` / try-catch.
 */

import { safeStorage } from "./safeStorage";

declare const __APP_VERSION__: string;

export type DatasetKey =
  | "prices"
  | "events"
  | "tenders"
  | "announcements"
  | "freelance_jobs"
  | "diaspora_projects";

interface ChecksumRecord {
  checksum: string;
  count: number;
  version: string;
  at: number;
}

const STORAGE_PREFIX = "ujamaan_ds_checksum_";

const getAppVersion = (): string => {
  try {
    return typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";
  } catch {
    return "dev";
  }
};

/**
 * FNV-1a 32-bit — rapide, déterministe, sans dépendance crypto (compat iOS Safari).
 */
export function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
  }
  return ("00000000" + hash.toString(16)).slice(-8);
}

/**
 * Calcule un checksum stable d'un dataset.
 * - Tri par id pour rester insensible à l'ordre de retour.
 * - Utilise `updated_at` si dispo, sinon `created_at`, sinon `''`.
 */
export function computeDatasetChecksum<
  T extends { id: string | number; updated_at?: string | null; created_at?: string | null }
>(items: T[] | null | undefined): { checksum: string; count: number } {
  if (!items || items.length === 0) {
    return { checksum: fnv1a("empty"), count: 0 };
  }
  const serialized = [...items]
    .map((it) => `${it.id}:${it.updated_at ?? it.created_at ?? ""}`)
    .sort()
    .join("|");
  return { checksum: fnv1a(serialized), count: items.length };
}

const storageKey = (k: DatasetKey) => `${STORAGE_PREFIX}${k}`;

export function readStoredChecksum(key: DatasetKey): ChecksumRecord | null {
  try {
    const raw = safeStorage.getItem(storageKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChecksumRecord;
    if (!parsed || typeof parsed.checksum !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredChecksum(
  key: DatasetKey,
  data: { checksum: string; count: number }
): void {
  try {
    const record: ChecksumRecord = {
      checksum: data.checksum,
      count: data.count,
      version: getAppVersion(),
      at: Date.now(),
    };
    safeStorage.setItem(storageKey(key), JSON.stringify(record));
  } catch {
    /* silent */
  }
}

export interface DatasetCoherenceResult {
  isStale: boolean;
  reason: "first_load" | "version_changed" | "checksum_changed" | "ok";
  previous: ChecksumRecord | null;
  current: ChecksumRecord;
}

/**
 * Compare le checksum fraîchement calculé avec celui stocké.
 * Émet `ujamaan:dataset-stale` sur `window` si une incohérence est détectée
 * (utile pour brancher tanstack-query.invalidateQueries depuis un seul listener global).
 */
export function validateDatasetCoherence<
  T extends { id: string | number; updated_at?: string | null; created_at?: string | null }
>(key: DatasetKey, items: T[] | null | undefined): DatasetCoherenceResult {
  const computed = computeDatasetChecksum(items);
  const previous = readStoredChecksum(key);
  const current: ChecksumRecord = {
    checksum: computed.checksum,
    count: computed.count,
    version: getAppVersion(),
    at: Date.now(),
  };

  let reason: DatasetCoherenceResult["reason"] = "ok";
  let isStale = false;

  if (!previous) {
    reason = "first_load";
  } else if (previous.version !== current.version) {
    reason = "version_changed";
    isStale = true;
  } else if (previous.checksum !== current.checksum) {
    reason = "checksum_changed";
    isStale = true;
  }

  writeStoredChecksum(key, computed);

  if (isStale && typeof window !== "undefined") {
    try {
      window.dispatchEvent(
        new CustomEvent("ujamaan:dataset-stale", {
          detail: { key, reason, previous, current },
        })
      );
    } catch {
      /* silent */
    }
  }

  return { isStale, reason, previous, current };
}

/**
 * Helper pour usage direct dans un useEffect React.
 *   useEffect(() => { trackDatasetCoherence("prices", prices); }, [prices]);
 */
export function trackDatasetCoherence<
  T extends { id: string | number; updated_at?: string | null; created_at?: string | null }
>(key: DatasetKey, items: T[] | null | undefined) {
  return validateDatasetCoherence(key, items);
}
