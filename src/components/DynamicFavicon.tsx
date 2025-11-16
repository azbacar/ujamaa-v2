import { useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export const DynamicFavicon = () => {
  const { settings } = useSiteSettings();

  useEffect(() => {
    if (settings?.site_favicon_url) {
      // Update favicon
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      
      link.href = settings.site_favicon_url;
    }

    // Update document title
    if (settings?.site_name) {
      document.title = `${settings.site_name} - Centre d'Information des Comores`;
    }
  }, [settings]);

  return null;
};
