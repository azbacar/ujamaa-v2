import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import '@fontsource/outfit/500.css'
import '@fontsource/outfit/600.css'
import '@fontsource/outfit/700.css'
import '@fontsource/figtree/400.css'
import '@fontsource/figtree/500.css'
import '@fontsource/figtree/600.css'
import './index.css'
import { checkAndPurgeStaleCache } from './lib/cacheBuster'

// 1) Purge automatique du cache si nouvelle version (corrige les pages blanches iPhone post-déploiement)
checkAndPurgeStaleCache();

// Après un déploiement, les anciens fichiers de page n'existent plus : on recharge une seule fois.
window.addEventListener('vite:preloadError', (e) => {
  e.preventDefault();
  try {
    if (sessionStorage.getItem('ujamaan_chunk_reload')) return;
    sessionStorage.setItem('ujamaan_chunk_reload', '1');
  } catch {}
  window.location.reload();
});
window.addEventListener('ujamaan:ready', () => {
  setTimeout(() => { try { sessionStorage.removeItem('ujamaan_chunk_reload'); } catch {} }, 10000);
});

// 2) Boot React avec filet de sécurité (évite la page blanche sur iOS Safari ancien)
function boot() {
  try {
    const root = document.getElementById("root");
    if (!root) throw new Error("Élément #root introuvable");
    createRoot(root).render(<App />);
    // Signale au filet HTML que React a démarré
    try { window.dispatchEvent(new Event('ujamaan:ready')); } catch {}
  } catch (err) {
    console.error('[Ujamaan] Boot error', err);
    // Le filet dans index.html prendra le relais après 8s
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
