import CategoryCard from '@/components/CategoryCard';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CategoryData {
  title: string;
  description: string;
  icon: string;
  itemCount: number;
  lastUpdate: string;
  featured?: boolean;
  link?: string;
}

const CategoriesSection = () => {
  const [categories, setCategories] = useState<CategoryData[]>([
    {
      title: "Prix & Marchés",
      description: "Prix actualisés des produits alimentaires et biens de consommation dans tous les marchés",
      icon: "💰",
      itemCount: 0,
      lastUpdate: "",
      featured: true,
      link: "/prix"
    },
    {
      title: "Appels d'Offres",
      description: "Marchés publics, appels à projets et opportunités d'affaires",
      icon: "📋",
      itemCount: 0,
      lastUpdate: "",
      link: "/appels-offres"
    },
    {
      title: "Événements",
      description: "Manifestations culturelles, cérémonies officielles et événements communautaires",
      icon: "🎭",
      itemCount: 0,
      lastUpdate: "",
      link: "/evenements"
    },
    {
      title: "Services Publics",
      description: "Horaires, contacts et informations sur les administrations et services",
      icon: "🏛️",
      itemCount: 0,
      lastUpdate: "",
      link: "/services"
    },
    {
      title: "Transport",
      description: "Horaires des liaisons, tarifs et informations de transport inter-îles",
      icon: "🚢",
      itemCount: 0,
      lastUpdate: ""
    },
    {
      title: "Santé",
      description: "Services de santé, pharmacies de garde et informations médicales",
      icon: "🏥",
      itemCount: 0,
      lastUpdate: "",
      featured: true,
      link: "/services"
    },
    {
      title: "Tourisme & Gastronomie",
      description: "Restaurants, hôtels, hébergements et découverte gastronomique locale",
      icon: "🏨",
      itemCount: 0,
      lastUpdate: "",
      featured: true,
      link: "/annonces?category=Tourisme%20%26%20Gastronomie"
    }
  ]);

  useEffect(() => {
    const fetchCategoriesData = async () => {
      try {
        // Prix & Marchés
        const { count: pricesCount, data: latestPrice } = await supabase
          .from('prices')
          .select('*', { count: 'exact', head: false })
          .eq('status', 'published')
          .order('updated_at', { ascending: false })
          .limit(1);

        // Appels d'Offres
        const { count: tendersCount, data: latestTender } = await supabase
          .from('content_items')
          .select('*', { count: 'exact', head: false })
          .eq('type', 'tender')
          .eq('status', 'published')
          .order('updated_at', { ascending: false })
          .limit(1);

        // Événements
        const { count: eventsCount, data: latestEvent } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: false })
          .eq('status', 'published')
          .order('updated_at', { ascending: false })
          .limit(1);

        // Services Publics
        const { count: servicesCount, data: latestService } = await supabase
          .from('content_items')
          .select('*', { count: 'exact', head: false })
          .eq('type', 'service')
          .eq('status', 'published')
          .order('updated_at', { ascending: false })
          .limit(1);

        // Tourisme & Gastronomie
        const { count: gastronomyCount, data: latestGastronomy } = await supabase
          .from('gastronomy_items')
          .select('*', { count: 'exact', head: false })
          .eq('status', 'published')
          .order('updated_at', { ascending: false })
          .limit(1);

        const formatLastUpdate = (date: string | null) => {
          if (!date) return "Aucune donnée";
          return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
        };

        setCategories(prev => prev.map(cat => {
          switch (cat.title) {
            case "Prix & Marchés":
              return { ...cat, itemCount: pricesCount || 0, lastUpdate: formatLastUpdate(latestPrice?.[0]?.updated_at) };
            case "Appels d'Offres":
              return { ...cat, itemCount: tendersCount || 0, lastUpdate: formatLastUpdate(latestTender?.[0]?.updated_at) };
            case "Événements":
              return { ...cat, itemCount: eventsCount || 0, lastUpdate: formatLastUpdate(latestEvent?.[0]?.updated_at) };
            case "Services Publics":
            case "Transport":
            case "Santé":
              return { ...cat, itemCount: servicesCount || 0, lastUpdate: formatLastUpdate(latestService?.[0]?.updated_at) };
            case "Tourisme & Gastronomie":
              return { ...cat, itemCount: gastronomyCount || 0, lastUpdate: formatLastUpdate(latestGastronomy?.[0]?.updated_at) };
            default:
              return cat;
          }
        }));
      } catch (error) {
        console.error('Erreur lors du chargement des données des catégories:', error);
      }
    };

    fetchCategoriesData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-center lg:text-left">
        <h2 className="text-4xl font-bold text-gray-900 mb-3">Catégories d'information</h2>
        <p className="text-xl text-gray-600">Explorez nos différentes catégories de données</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {categories.map((category, index) => (
          <CategoryCard
            key={index}
            title={category.title}
            description={category.description}
            icon={<span className="text-3xl">{category.icon}</span>}
            itemCount={category.itemCount}
            lastUpdate={category.lastUpdate}
            featured={category.featured}
            link={category.link}
          />
        ))}
      </div>
    </div>
  );
};

export default CategoriesSection;
