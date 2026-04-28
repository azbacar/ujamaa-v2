import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { checkAndPurgeStaleCache } from './lib/cacheBuster'

// 1) Purge automatique du cache si nouvelle version (corrige les pages blanches iPhone post-déploiement)
checkAndPurgeStaleCache();

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
