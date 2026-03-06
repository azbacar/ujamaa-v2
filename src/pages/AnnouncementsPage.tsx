import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, ArrowRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdSpace from '@/components/AdSpace';
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

const AnnouncementsPage = () => {
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('content_items')
          .select('id, title, category, description, created_at, author_id, type')
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Map content items to announcements with display types
        const mappedData: Announcement[] = (data || []).map((item: ContentItem, index: number) => ({
          ...item,
          type: index === 0 ? 'featured' : index < 5 ? 'urgent' : 'normal'
        }));
        
        setAnnouncements(mappedData);
      } catch (error) {
        console.error('Erreur lors du chargement des annonces:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
    
    // Check URL params for category filter
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    if (category) {
      setSelectedCategory(category);
    }
  }, []);

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (announcement.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesCategory = selectedCategory === 'all' || announcement.category === selectedCategory;
    const matchesType = selectedType === 'all' || announcement.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Il y a moins d\'une heure';
    if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
      
      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold gradient-text mb-4">📢 Toutes les Annonces</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez toutes les dernières informations et annonces officielles des Comores
          </p>
        </div>

        {/* Filtres */}
        <Card className="glass-effect mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher une annonce..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  <SelectItem value="Prix & Marchés">Prix & Marchés</SelectItem>
                  <SelectItem value="Appels d'Offres">Appels d'Offres</SelectItem>
                  <SelectItem value="Événements">Événements</SelectItem>
                  <SelectItem value="Transports">Transports</SelectItem>
                  <SelectItem value="Santé">Santé</SelectItem>
                  <SelectItem value="Éducation">Éducation</SelectItem>
                  <SelectItem value="Tourisme & Gastronomie">Tourisme & Gastronomie</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="urgent">🚨 Urgent</SelectItem>
                  <SelectItem value="featured">⭐ À la une</SelectItem>
                  <SelectItem value="normal">📢 Normal</SelectItem>
                </SelectContent>
              </Select>

              <Button className="bg-gradient-to-r from-emerald-500 to-ocean-500">
                Filtrer ({filteredAnnouncements.length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Espace publicitaire - banner */}
        <div className="mb-8">
          <AdSpace size="banner" position="header" className="mx-auto" />
        </div>

        {/* Liste des annonces */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Chargement des annonces...</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnnouncements.map((announcement) => (
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
        )}

        {!loading && filteredAnnouncements.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucune annonce trouvée avec ces critères.</p>
          </div>
        )}

        {/* Section d'action */}
        <div className="text-center mt-12 space-y-6">
          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-8 rounded-3xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              📢 Vous avez une annonce importante ?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Partagez vos annonces avec la communauté sur UJAMAA pour toucher un large public aux Comores et à Mayotte.
            </p>
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/auth'}
              className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-500 text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:shadow-blue-500/50 transition-all hover:scale-105"
            >
              ✨ Publier une annonce
            </Button>
          </div>
        </div>

        {/* Footer ad */}
        <div className="mt-8 flex justify-center">
          <AdSpace size="banner" position="footer" lazy />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AnnouncementsPage;