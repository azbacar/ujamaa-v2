import { useEffect } from 'react';

interface PageSEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonicalPath?: string;
  noIndex?: boolean;
}

const BASE_URL = 'https://ujamaan.com';
const DEFAULT_TITLE = 'Ujamaan - Centre d\'Information des Comores';
const DEFAULT_DESCRIPTION = 'Plateforme centrale pour tous les prix, événements, services et informations officielles des îles Comores';

export const usePageSEO = ({
  title,
  description,
  keywords,
  ogImage,
  ogType = 'website',
  canonicalPath,
  noIndex = false,
}: PageSEOProps = {}) => {
  useEffect(() => {
    // Title
    const fullTitle = title ? `${title} | Ujamaan` : DEFAULT_TITLE;
    document.title = fullTitle;

    const setMeta = (selector: string, attrs: Record<string, string>) => {
      let el: HTMLMetaElement | null = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        document.head.appendChild(el);
      }
      Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
    };

    // Description
    const desc = description || DEFAULT_DESCRIPTION;
    setMeta('meta[name="description"]', { name: 'description', content: desc });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: desc });
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: desc });

    // Title OG
    setMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle });
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: fullTitle });

    // OG Type
    setMeta('meta[property="og:type"]', { property: 'og:type', content: ogType });

    // OG Image
    if (ogImage) {
      setMeta('meta[property="og:image"]', { property: 'og:image', content: ogImage });
      setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: ogImage });
    }

    // Keywords
    if (keywords) {
      setMeta('meta[name="keywords"]', { name: 'keywords', content: keywords });
    }

    // Canonical
    if (canonicalPath) {
      let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = `${BASE_URL}${canonicalPath}`;
    }

    // OG URL
    if (canonicalPath) {
      setMeta('meta[property="og:url"]', { property: 'og:url', content: `${BASE_URL}${canonicalPath}` });
    }

    // noindex
    if (noIndex) {
      setMeta('meta[name="robots"]', { name: 'robots', content: 'noindex, nofollow' });
    } else {
      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (robotsMeta) robotsMeta.remove();
    }

    // Cleanup on unmount - restore defaults
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title, description, keywords, ogImage, ogType, canonicalPath, noIndex]);
};
