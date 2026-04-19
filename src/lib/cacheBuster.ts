/**
 * Système de purge automatique du cache à chaque déploiement.
 * - Compare la version stockée localement à la version courante du build.
 * - Si différente : purge sessionStorage, caches Service Worker, et les clés "stale" de localStorage
 *   (en préservant les éléments critiques comme l'auth Supabase et les préférences utilisateur).
 * - Force un reload propre la première fois pour servir les nouveaux assets.
 *
 * La version est injectée par Vite via __APP_VERSION__ (timestamp du build).
 */

declare const __APP_VERSION__: string;

const VERSION_KEY = 'ujamaan_app_version';

// Clés à PRÉSERVER lors d'une purge (auth, langue, préférences essentielles)
const PRESERVED_KEY_PATTERNS = [
  /^sb-/,                       // Tokens Supabase
  /^supabase\./,                // Supabase legacy
  /^ujamaan_app_version$/,      // notre propre version
  /^language$/,                 // préférence langue
  /^i18nextLng$/,
  /^cookie_consent/,            // consentement RGPD
];

const shouldPreserve = (key: string): boolean => PRESERVED_KEY_PATTERNS.some((re) => re.test(key));

const purgeNonEssentialLocalStorage = () => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && !shouldPreserve(k)) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => {
      try { localStorage.removeItem(k); } catch {}
    });
  } catch {}
};

const purgeSessionStorage = () => {
  try { sessionStorage.clear(); } catch {}
};

const purgeServiceWorkerCaches = async () => {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
    }
  } catch {}
  try {
    if (typeof caches !== 'undefined' && caches.keys) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
    }
  } catch {}
};

export async function checkAndPurgeStaleCache(): Promise<void> {
  try {
    const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
    let storedVersion: string | null = null;
    try { storedVersion = localStorage.getItem(VERSION_KEY); } catch {}

    if (storedVersion === currentVersion) {
      // Déjà à jour — purge silencieuse des caches SW (sécurité, anti page-blanche iOS)
      return;
    }

    // Nouvelle version détectée → purge complète
    purgeNonEssentialLocalStorage();
    purgeSessionStorage();
    await purgeServiceWorkerCaches();

    try { localStorage.setItem(VERSION_KEY, currentVersion); } catch {}

    // Si on a fait une vraie mise à jour (pas le tout 1er chargement), reload pour récupérer les nouveaux assets
    if (storedVersion && storedVersion !== currentVersion) {
      // Petit délai pour laisser le SW se désinscrire
      setTimeout(() => {
        try { window.location.reload(); } catch {}
      }, 100);
    }
  } catch {
    // Silencieux — ne jamais bloquer le boot de l'app
  }
}
