import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

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
        const { data: dbCategories } = await supabase
          .from('homepage_categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!dbCategories || dbCategories.length === 0) return;

        const [
          { count: pricesCount, data: latestPrice },
          { count: tendersCount, data: latestTender },
          { count: eventsCount, data: latestEvent },
          { count: servicesCount, data: latestService },
          { count: gastronomyCount, data: latestGastronomy },
          { count: taxiCount, data: latestTaxi },
          { count: transportAdsCount, data: latestTransportAd },
          { count: bricolageCount, data: latestBricolage },
        ] = await Promise.all([
          supabase.from('prices').select('*', { count: 'exact', head: false }).eq('status', 'published').order('updated_at', { ascending: false }).limit(1),
          supabase.from('content_items').select('*', { count: 'exact', head: false }).eq('type', 'tender').eq('status', 'published').order('updated_at', { ascending: false }).limit(1),
          supabase.from('events').select('*', { count: 'exact', head: false }).eq('status', 'published').gte('date', new Date().toISOString()).order('updated_at', { ascending: false }).limit(1),
          supabase.from('content_items').select('*', { count: 'exact', head: false }).eq('type', 'service').eq('status', 'published').order('updated_at', { ascending: false }).limit(1),
          supabase.from('gastronomy_items').select('*', { count: 'exact', head: false }).eq('status', 'published').order('updated_at', { ascending: false }).limit(1),
          supabase.from('taxi_fares').select('*', { count: 'exact', head: false }).eq('is_active', true).order('updated_at', { ascending: false }).limit(1),
          supabase.from('content_items').select('*', { count: 'exact', head: false }).eq('status', 'published').ilike('category', '%transport%').order('updated_at', { ascending: false }).limit(1),
          supabase.from('content_items').select('*', { count: 'exact', head: false }).eq('status', 'published').ilike('category', '%bricolage%').order('updated_at', { ascending: false }).limit(1),
        ]);

        const formatLastUpdate = (date: string | null) => {
          if (!date) return "—";
          return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
        };

        const enriched: CategoryData[] = dbCategories.map(cat => {
          let itemCount = 0;
          let lastUpdate = "—";
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
            case "Transport":
              itemCount = (taxiCount || 0) + (transportAdsCount || 0);
              lastUpdate = formatLastUpdate(
                latestTaxi?.[0]?.updated_at ?? latestTransportAd?.[0]?.updated_at ?? null
              );
              break;
            case "Bricolage et Maintenance":
              itemCount = bricolageCount || 0;
              lastUpdate = formatLastUpdate(latestBricolage?.[0]?.updated_at ?? null);
              break;
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
        console.error('Erreur chargement catégories:', error);
      }
    };

    fetchCategoriesData();
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg sm:text-xl font-bold text-foreground">📂 Catégories</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((category, index) => {
          const content = (
            <Card className={`group hover:shadow-md hover:border-primary/20 transition-all duration-200 ${category.featured ? 'border-primary/30 bg-primary/[0.02]' : ''}`}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`text-2xl flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${category.featured ? 'bg-primary/10' : 'bg-muted'}`}>
                  {category.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                      {category.title}
                    </h3>
                    {category.featured && (
                      <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                        ★
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{category.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    <span className="font-medium text-foreground">{category.itemCount} éléments</span>
                    <span>·</span>
                    <span>{category.lastUpdate}</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
              </CardContent>
            </Card>
          );

          return category.link ? (
            <Link key={index} to={category.link} className="block">
              {content}
            </Link>
          ) : (
            <div key={index}>{content}</div>
          );
        })}
      </div>
    </section>
  );
};

export default CategoriesSection;
