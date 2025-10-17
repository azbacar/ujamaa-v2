import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Clock, Users, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/components/LanguageProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Event {
  id: string;
  title: string;
  description: string;
  published_at: string;
  category: string;
  views: number;
  status: 'draft' | 'published' | 'archived';
  type: 'event' | 'tender' | 'announcement' | 'service';
}

const EventsPage = () => {
  const { t } = useLanguage();
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIsland, setSelectedIsland] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .eq('type', 'event')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
  };

  const mockEvents: Event[] = [
    {
      id: "1",
      title: "Festival Culturel de Moroni",
      description: "Célébration de la culture comorienne avec danses traditionnelles, musique et artisanat local",
      published_at: "2024-02-15T14:00:00",
      category: "Culturel",
      views: 2000,
      status: "published",
      type: "event"
    },
    {
      id: "2",
      title: "Conférence sur l'Agriculture Durable",
      description: "Forum sur les techniques agricoles modernes et durables aux Comores",
      published_at: "2024-02-20T09:00:00",
      category: "Éducation",
      views: 150,
      status: "published",
      type: "event"
    },
    {
      id: "3",
      title: "Tournoi de Football Inter-îles",
      description: "Compétition sportive rassemblant les équipes des quatre îles",
      published_at: "2024-02-25T15:30:00",
      category: "Sport",
      views: 5000,
      status: "published",
      type: "event"
    },
    {
      id: "4",
      title: "Salon de l'Artisanat Local",
      description: "Exposition et vente d'objets d'artisanat traditionnel comorien",
      published_at: "2024-03-01T10:00:00",
      category: "Commerce",
      views: 800,
      status: "published",
      type: "event"
    },
    {
      id: "5",
      title: "Séminaire sur le Tourisme Durable",
      description: "Développement du tourisme respectueux de l'environnement",
      published_at: "2024-03-05T08:30:00",
      category: "Business",
      views: 120,
      status: "published",
      type: "event"
    }
  ];

  const displayEvents = events.length > 0 ? events : mockEvents;

  const filteredEvents = displayEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50">
        <Header currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
        <main className="container mx-auto px-6 py-12">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chargement des événements...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Culturel': return '🎭';
      case 'Éducation': return '📚';
      case 'Sport': return '⚽';
      case 'Commerce': return '🛍️';
      case 'Business': return '💼';
      default: return '📅';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50">
      <Header currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
      
      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold gradient-text mb-4">🎭 Événements</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez tous les événements culturels, sportifs et sociaux des Comores
          </p>
        </div>

        {/* Filtres */}
        <Card className="glass-effect mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher un événement..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedIsland} onValueChange={setSelectedIsland}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les îles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les îles</SelectItem>
                  <SelectItem value="Grande Comore">Grande Comore</SelectItem>
                  <SelectItem value="Anjouan">Anjouan</SelectItem>
                  <SelectItem value="Mohéli">Mohéli</SelectItem>
                  <SelectItem value="Mayotte">Mayotte</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  <SelectItem value="Culturel">Culturel</SelectItem>
                  <SelectItem value="Éducation">Éducation</SelectItem>
                  <SelectItem value="Sport">Sport</SelectItem>
                  <SelectItem value="Commerce">Commerce</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                </SelectContent>
              </Select>

              <Button className="bg-gradient-to-r from-emerald-500 to-ocean-500">
                Filtrer ({filteredEvents.length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Liste des événements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="card-hover">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryIcon(event.category)}</span>
                    <div>
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{event.category || 'Général'}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(event.status)}>
                    {event.status === 'published' ? 'Publié' : 
                     event.status === 'draft' ? 'Brouillon' : 'Archivé'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                 <p className="text-gray-700">{event.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>{new Date(event.published_at || Date.now()).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>{event.views} vues</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4">
                  <Badge variant="outline" className="text-emerald-700 border-emerald-300">
                    📂 {event.category || 'Général'}
                  </Badge>
                  <Link to={`/evenements/${event.id}`}>
                    <Button variant="outline" size="sm">
                      Voir détails
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucun événement trouvé avec ces critères.</p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default EventsPage;