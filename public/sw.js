/**
 * Ujamaan — Kill-switch Service Worker
 * --------------------------------------
 * PWA INTERDITE sur Ujamaan (cf. mem://constraints/no-pwa-and-ios-compat).
 * Ce fichier n'est PAS un vrai service worker applicatif : il sert uniquement
 * à désinscrire de force tout ancien SW resté enregistré dans les navigateurs
 * des visiteurs (cause de pages blanches iPhone et de versions périmées).
 *
 * Toute requête du navigateur pour /sw.js ou /service-worker.js charge ce
 * code, qui :
 *   1. Prend immédiatement le contrôle (skipWaiting + clients.claim)
 *   2. Vide toutes les Cache Storage de l'origine
 *   3. Recharge les onglets ouverts pour servir la dernière version
 *   4. Se désinscrit lui-même (dans `finally`, garanti même si erreur)
 *
 * Ne JAMAIS enregistrer un nouveau SW côté app sans lever la contrainte
 * "No PWA + iOS" et mettre à jour la mémoire projet.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      // Purge totale des caches origine — aucun SW applicatif ne doit subsister
      const keys = await caches.keys();
      await Promise.allSettled(keys.map((k) => caches.delete(k)));

      // Reprend le contrôle des onglets ouverts et force un reload propre
      await self.clients.claim();
      const windowClients = await self.clients.matchAll({ type: 'window' });
      await Promise.allSettled(
        windowClients.map((client) => client.navigate(client.url).catch(() => null))
      );
    } finally {
      // Garanti : on se désinscrit, même si une étape ci-dessus a échoué
      try { await self.registration.unregister(); } catch (_) {}
    }
  })());
});

// Aucune interception fetch — laisse le réseau servir tout normalement
