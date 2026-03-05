import { useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export const DynamicFavicon = () => {
  const { settings } = useSiteSettings();

  useEffect(() => {
    if (!settings) return;

    // Update favicon
    if (settings.site_favicon_url) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = settings.site_favicon_url;
    }

    // Update document title
    if (settings.site_name) {
      document.title = `${settings.site_name} - Centre d'Information des Comores`;
    }

    // Helper to set/update a meta tag
    const setMeta = (selector: string, attrs: Record<string, string>) => {
      let el: HTMLMetaElement | null = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        document.head.appendChild(el);
      }
      Object.entries(attrs).forEach(([key, value]) => {
        el!.setAttribute(key, value);
      });
    };

    // OG meta tags
    const ogTitle = settings.og_title || settings.site_name || 'Ujamaan';
    const ogDesc = settings.og_description || '';
    const ogImage = settings.og_image_url || '';
    const twitterCard = settings.twitter_card || 'summary_large_image';
    const twitterSite = settings.twitter_site || '';
    const seoKeywords = settings.seo_keywords || '';

    if (ogTitle) {
      setMeta('meta[property="og:title"]', { property: 'og:title', content: ogTitle });
      setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: ogTitle });
    }
    if (ogDesc) {
      setMeta('meta[property="og:description"]', { property: 'og:description', content: ogDesc });
      setMeta('meta[name="description"]', { name: 'description', content: ogDesc });
      setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: ogDesc });
    }
    if (ogImage) {
      setMeta('meta[property="og:image"]', { property: 'og:image', content: ogImage });
      setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: ogImage });
    }
    if (twitterCard) {
      setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: twitterCard });
    }
    if (twitterSite) {
      setMeta('meta[name="twitter:site"]', { name: 'twitter:site', content: twitterSite });
    }
    if (seoKeywords) {
      setMeta('meta[name="keywords"]', { name: 'keywords', content: seoKeywords });
    }
  }, [settings]);

  return null;
};
