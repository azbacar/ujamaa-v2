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
  const [categories, setCategories] = useState<CategoryData[]>([]);

  useEffect(() => {
    const fetchCategoriesData = async () => {
      try {
        // Fetch categories from DB
        const { data: dbCategories } = await supabase
          .from('homepage_categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!dbCategories || dbCategories.length === 0) return;

        // Fetch counts for enrichment
        const [
          { count: pricesCount, data: latestPrice },
          { count: tendersCount, data: latestTender },
          { count: eventsCount, data: latestEvent },
          { count: servicesCount, data: latestService },
          { count: gastronomyCount, data: latestGastronomy }
        ] = await Promise.all([
          supabase.from('prices').select('*', { count: 'exact', head: false }).eq('status', 'published').order('updated_at', { ascending: false }).limit(1),
          supabase.from('content_items').select('*', { count: 'exact', head: false }).eq('type', 'tender').eq('status', 'published').order('updated_at', { ascending: false }).limit(1),
          supabase.from('events').select('*', { count: 'exact', head: false }).eq('status', 'published').order('updated_at', { ascending: false }).limit(1),
          supabase.from('content_items').select('*', { count: 'exact', head: false }).eq('type', 'service').eq('status', 'published').order('updated_at', { ascending: false }).limit(1),
          supabase.from('gastronomy_items').select('*', { count: 'exact', head: false }).eq('status', 'published').order('updated_at', { ascending: false }).limit(1),
        ]);

        const formatLastUpdate = (date: string | null) => {
          if (!date) return "Aucune donnée";
          return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
        };

        const enriched: CategoryData[] = dbCategories.map(cat => {
          let itemCount = 0;
          let lastUpdate = "Aucune donnée";
          switch (cat.title) {
            case "Prix & Marchés":
              itemCount = pricesCount || 0;
              lastUpdate = formatLastUpdate(latestPrice?.[0]?.updated_at ?? null);
              break;
            case "Appels d'Offres":
              itemCount = tendersCount || 0;
              lastUpdate = formatLastUpdate(latestTender?.[0]?.updated_at ?? null);
              break;
            case "Événements":
              itemCount = eventsCount || 0;
              lastUpdate = formatLastUpdate(latestEvent?.[0]?.updated_at ?? null);
              break;
            case "Services Publics":
            case "Transport":
            case "Santé":
              itemCount = servicesCount || 0;
              lastUpdate = formatLastUpdate(latestService?.[0]?.updated_at ?? null);
              break;
            case "Tourisme & Gastronomie":
              itemCount = gastronomyCount || 0;
              lastUpdate = formatLastUpdate(latestGastronomy?.[0]?.updated_at ?? null);
              break;
          }
          return {
            title: cat.title,
            description: cat.description,
            icon: cat.icon,
            itemCount,
            lastUpdate,
            featured: cat.featured,
            link: cat.link || undefined,
          };
        });

        setCategories(enriched);
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
