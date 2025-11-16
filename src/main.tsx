import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { DynamicFavicon } from './components/DynamicFavicon'

createRoot(document.getElementById("root")!).render(
  <>
    <DynamicFavicon />
    <App />
  </>
);
