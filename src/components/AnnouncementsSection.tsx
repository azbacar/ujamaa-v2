import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface ContentItem {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  type: string;
  created_at: string;
}

const AnnouncementsSection = () => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('content_items')
          .select('id, title, category, description, created_at, type')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(4);

        if (!error && data) setItems(data);
      } catch (error) {
        console.error('Erreur chargement annonces:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const getRelativeTime = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'À l\'instant';
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}j`;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'tender': return 'Appel d\'offres';
      case 'event': return 'Événement';
      case 'service': return 'Service';
      default: return 'Annonce';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tender': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'event': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'service': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  if (loading) {
    return (
      <section className="space-y-3">
        <div className="h-5 bg-muted rounded w-40 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-36 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold text-foreground">📢 Dernières annonces</h2>
        <Link to="/annonces" className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
          Tout voir <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <Link key={item.id} to={`/annonces/${item.id}`}>
            <Card className="h-full hover:shadow-md hover:border-primary/20 transition-all duration-200 group">
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className={`${getTypeColor(item.type)} text-[10px] px-1.5 py-0.5`}>
                    {getTypeLabel(item.type)}
                  </Badge>
                  {item.category && (
                    <span className="text-[10px] text-muted-foreground">{item.category}</span>
                  )}
                </div>

                <h3 className="font-semibold text-sm text-foreground mb-1.5 group-hover:text-primary transition-colors line-clamp-2 flex-grow">
                  {item.title}
                </h3>

                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {item.description}
                  </p>
                )}

                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-auto">
                  <Clock className="w-3 h-3" />
                  <span>{getRelativeTime(item.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default AnnouncementsSection;
