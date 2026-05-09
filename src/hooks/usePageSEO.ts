import { useEffect } from 'react';

interface PageSEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonicalPath?: string;
  noIndex?: boolean;
  /** Catégorie affichée sur l'image OG dynamique (ex: "Prix", "Événement") */
  ogCategory?: string;
}

const BASE_URL = 'https://ujamaan.com';
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://vpibvgdpeiicczelbynf.supabase.co';
const DEFAULT_TITLE = 'Ujamaan - Centre d\'Information des Comores';
const DEFAULT_DESCRIPTION = 'Plateforme centrale pour tous les prix, événements, services et informations officielles des îles Comores';

const SUPPORTED_LANGS = ['fr', 'ar', 'sw', 'en'] as const;
type Lang = typeof SUPPORTED_LANGS[number];

const detectCurrentLang = (): Lang => {
  try {
    const url = new URL(window.location.href);
    const q = url.searchParams.get('lang');
    if (q && (SUPPORTED_LANGS as readonly string[]).includes(q)) return q as Lang;
    const stored = window.localStorage?.getItem('ujamaan:lang');
    if (stored && (SUPPORTED_LANGS as readonly string[]).includes(stored)) return stored as Lang;
  } catch { /* noop */ }
  return 'fr';
};

const buildDynamicOgImage = (title: string, description: string, category?: string, lang: Lang = 'fr') => {
  const params = new URLSearchParams({
    title: title.slice(0, 140),
    subtitle: description.slice(0, 160),
    lang,
  });
  if (category) params.set('category', category);
  return `${SUPABASE_URL}/functions/v1/og-image?${params.toString()}`;
};

export const usePageSEO = ({
  title,
  description,
  keywords,
  ogImage,
  ogType = 'website',
  canonicalPath,
  noIndex = false,
  ogCategory,
}: PageSEOProps = {}) => {
  useEffect(() => {
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

    const desc = description || DEFAULT_DESCRIPTION;
    setMeta('meta[name="description"]', { name: 'description', content: desc });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: desc });
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: desc });

    setMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle });
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: fullTitle });
    setMeta('meta[property="og:type"]', { property: 'og:type', content: ogType });
    setMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: 'Ujamaan' });
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });

    // OG Image — dynamique si non fourni explicitement
    const lang = detectCurrentLang();
    const imageUrl = ogImage || buildDynamicOgImage(title || 'Ujamaan', desc, ogCategory, lang);
    setMeta('meta[property="og:image"]', { property: 'og:image', content: imageUrl });
    setMeta('meta[property="og:image:width"]', { property: 'og:image:width', content: '1200' });
    setMeta('meta[property="og:image:height"]', { property: 'og:image:height', content: '630' });
    setMeta('meta[property="og:image:alt"]', { property: 'og:image:alt', content: fullTitle });
    setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: imageUrl });

    // og:locale
    const localeMap: Record<Lang, string> = { fr: 'fr_FR', ar: 'ar_KM', sw: 'sw_KE', en: 'en_US' };
    setMeta('meta[property="og:locale"]', { property: 'og:locale', content: localeMap[lang] });
    SUPPORTED_LANGS.filter((l) => l !== lang).forEach((l) => {
      const sel = `meta[property="og:locale:alternate"][content="${localeMap[l]}"]`;
      if (!document.querySelector(sel)) {
        const m = document.createElement('meta');
        m.setAttribute('property', 'og:locale:alternate');
        m.setAttribute('content', localeMap[l]);
        document.head.appendChild(m);
      }
    });

    // <html lang>
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    if (keywords) {
      setMeta('meta[name="keywords"]', { name: 'keywords', content: keywords });
    }

    // Canonical + hreflang alternates
    if (canonicalPath) {
      const canonical = `${BASE_URL}${canonicalPath}`;
      let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonical;
      setMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });

      // hreflang : nettoyer puis injecter
      document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((n) => n.remove());
      const buildHref = (l: Lang) => {
        const u = new URL(canonical);
        if (l === 'fr') u.searchParams.delete('lang');
        else u.searchParams.set('lang', l);
        return u.toString();
      };
      SUPPORTED_LANGS.forEach((l) => {
        const a = document.createElement('link');
        a.rel = 'alternate';
        a.hreflang = l;
        a.href = buildHref(l);
        document.head.appendChild(a);
      });
      const xDefault = document.createElement('link');
      xDefault.rel = 'alternate';
      xDefault.hreflang = 'x-default';
      xDefault.href = buildHref('fr');
      document.head.appendChild(xDefault);
    }

    if (noIndex) {
      setMeta('meta[name="robots"]', { name: 'robots', content: 'noindex, nofollow' });
    } else {
      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (robotsMeta) robotsMeta.remove();
    }

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title, description, keywords, ogImage, ogType, canonicalPath, noIndex, ogCategory]);
};
