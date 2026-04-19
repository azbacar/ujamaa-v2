import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { checkAndPurgeStaleCache } from './lib/cacheBuster'

// Purge automatique du cache si nouvelle version (corrige les pages blanches iPhone post-déploiement)
checkAndPurgeStaleCache();

const root = document.getElementById("root")!;

createRoot(root).render(<App />);

