import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    // Empêche le navigateur de restaurer la position (souvent responsable d'un chargement "en bas")
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useLayoutEffect(() => {
    // LayoutEffect = avant paint, évite l'affichage initial en bas
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  // Double-sécurité après montage (certains navigateurs/restaurations tardives)
  useEffect(() => {
    const id = window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
