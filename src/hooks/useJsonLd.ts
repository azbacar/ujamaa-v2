import { useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export const useJsonLd = () => {
  const { settings } = useSiteSettings();

  useEffect(() => {
    const siteName = settings?.site_name || 'Ujamaan';
    const siteUrl = 'https://ujamaan.com';
    const logoUrl = settings?.site_logo_url || `${siteUrl}/favicon.png`;
    const description = settings?.og_description || 'Plateforme centrale pour tous les prix, événements, services et informations officielles des îles Comores';

    // Organization schema
    const orgSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: siteName,
      url: siteUrl,
      logo: logoUrl,
      description,
      sameAs: [
        settings?.twitter_site ? `https://twitter.com/${settings.twitter_site.replace('@', '')}` : null,
      ].filter(Boolean),
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['French', 'Arabic'],
      },
    };

    // WebSite schema with search
    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteName,
      url: siteUrl,
      description,
      inLanguage: ['fr', 'ar'],
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/annonces?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    };

    // BreadcrumbList for main navigation
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Prix', item: `${siteUrl}/prix` },
        { '@type': 'ListItem', position: 3, name: 'Événements', item: `${siteUrl}/evenements` },
        { '@type': 'ListItem', position: 4, name: 'Annonces', item: `${siteUrl}/annonces` },
        { '@type': 'ListItem', position: 5, name: 'Services', item: `${siteUrl}/services` },
        { '@type': 'ListItem', position: 6, name: 'Carte des vendeurs', item: `${siteUrl}/carte-vendeurs` },
        { '@type': 'ListItem', position: 7, name: 'Investissement', item: `${siteUrl}/investissement` },
      ],
    };

    const schemas = [orgSchema, websiteSchema, breadcrumbSchema];

    // Remove existing JSON-LD
    document.querySelectorAll('script[data-seo-jsonld]').forEach(el => el.remove());

    // Add new JSON-LD
    schemas.forEach((schema, i) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', `schema-${i}`);
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      document.querySelectorAll('script[data-seo-jsonld]').forEach(el => el.remove());
    };
  }, [settings]);
};
