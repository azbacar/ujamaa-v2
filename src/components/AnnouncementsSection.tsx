import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface ContentItem {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  type: 'announcement' | 'event' | 'service' | 'tender';
  created_at: string;
  author_id: string;
}

interface Announcement extends Omit<ContentItem, 'type'> {
  type: 'urgent' | 'normal' | 'featured';
}

const AnnouncementsSection = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('content_items')
          .select('id, title, category, description, created_at, author_id, type')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(6);

        if (error) throw error;
        
        // Map content items to announcements with display types
        const mappedData: Announcement[] = (data || []).map((item: ContentItem, index: number) => ({
          ...item,
          type: index === 0 ? 'featured' : index < 3 ? 'urgent' : 'normal'
        }));
        
        setAnnouncements(mappedData);
      } catch (error) {
        console.error('Erreur lors du chargement des annonces:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'featured':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'urgent':
        return '🚨 Urgent';
      case 'featured':
        return '⭐ À la une';
      default:
        return '📢 Nouveau';
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Il y a moins d\'une heure';
    if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <section className="space-y-8">
        <div className="text-center">
          <p className="text-xl text-gray-600">Chargement des annonces...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6 sm:space-y-8">
      <div className="text-center space-y-3 sm:space-y-4">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black gradient-text">
          🤖 Annonces Alimentées par l'IA
        </h2>
        <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto">
          UJAMAA IA analyse et organise automatiquement les dernières informations pour vous offrir 
          <span className="text-emerald-600 font-semibold"> les annonces les plus pertinentes</span> en temps réel.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="feature-card card-hover group h-full">
            <CardContent className="p-6 h-full flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <Badge variant="secondary" className={`${getTypeColor(announcement.type)} px-3 py-1`}>
                  {getTypeLabel(announcement.type)}
                </Badge>
                <Badge variant="outline" className="text-xs bg-white/50">
                  {announcement.category}
                </Badge>
              </div>

              <h3 className="font-bold text-lg text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors line-clamp-2">
                {announcement.title}
              </h3>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
                {announcement.description || 'Aucune description disponible'}
              </p>

              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>{getRelativeTime(announcement.created_at)}</span>
                </div>
              </div>

              <Link to={`/annonces/${announcement.id}`}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:shadow-magenta-200/50 transition-all group"
                >
                  <span>Lire plus</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center pt-8">
        <Link to="/annonces">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-ocean-500 text-white px-12 py-4 rounded-2xl font-bold shadow-xl hover:shadow-magenta-500/50 transition-all text-lg"
          >
            🔍 Voir toutes les annonces
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default AnnouncementsSection;