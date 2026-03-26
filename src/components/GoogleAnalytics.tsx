import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export function GoogleAnalytics() {
  const { settings } = useSiteSettings();
  const location = useLocation();
  const gaId = (settings as any)?.ga_tracking_id;

  // Load GA script when tracking ID is available
  useEffect(() => {
    if (!gaId) return;

    // Avoid duplicate script injection
    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${gaId}"]`)) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    const inlineScript = document.createElement('script');
    inlineScript.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}', { send_page_view: false });
    `;
    document.head.appendChild(inlineScript);

    return () => {
      script.remove();
      inlineScript.remove();
    };
  }, [gaId]);

  // Track page views on route change
  useEffect(() => {
    if (!gaId || !(window as any).gtag) return;
    (window as any).gtag('config', gaId, {
      page_path: location.pathname + location.search,
    });
  }, [location, gaId]);

  return null;
}
