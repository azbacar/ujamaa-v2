import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Users, Search, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdSpace from '@/components/AdSpace';
import { useLanguage } from '@/components/LanguageProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  island: string;
  category: string;
  views: number;
  price: number;
  currency: string;
  registered_count: number;
  capacity: number | null;
  status: string;
  requires_payment: boolean;
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
        .from('events')
        .select('*')
        .eq('status', 'published')
        .order('date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIsland = selectedIsland === 'all' || event.island === selectedIsland;
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    
    return matchesSearch && matchesIsland && matchesCategory;
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Culturel': return '🎭';
      case 'Éducation': return '📚';
      case 'Sport': return '⚽';
      case 'Commerce': return '🛍️';
      case 'Business': return '💼';
      case 'Formation': return '🎓';
      case 'Professionnel': return '💼';
      case 'Culture': return '🎨';
      default: return '📅';
    }
  };

  const isUpcoming = (dateStr: string) => new Date(dateStr) > new Date();
  const isFull = (event: Event) => event.capacity && event.registered_count >= event.capacity;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50">
      <Header currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
      
      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold gradient-text mb-4">🎭 Événements</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Découvrez tous les événements culturels, sportifs et sociaux des Comores
          </p>
        </div>

        {/* Filtres */}
        <Card className="glass-effect mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
                  <SelectItem value="Formation">Formation</SelectItem>
                </SelectContent>
              </Select>

              <Button className="bg-gradient-to-r from-emerald-500 to-ocean-500">
                Filtrer ({filteredEvents.length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Espace publicitaire */}
        <div className="mb-8">
          <AdSpace size="medium" position="content" className="mx-auto" />
        </div>

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
                      <p className="text-sm text-muted-foreground mt-1">{event.category || 'Général'}</p>
                    </div>
                  </div>
                  {!isUpcoming(event.date) && (
                    <Badge variant="secondary">Passé</Badge>
                  )}
                  {isFull(event) && isUpcoming(event.date) && (
                    <Badge variant="destructive">Complet</Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-foreground">{event.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>{new Date(event.date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>{event.island}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>{event.registered_count} inscrits {event.capacity ? `/ ${event.capacity}` : ''}</span>
                  </div>
                  {event.requires_payment && (
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold">{event.price} {event.currency}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-4">
                  <Badge variant="outline" className="text-emerald-700 border-emerald-300">
                    📍 {event.location}
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
            <p className="text-muted-foreground text-lg">Aucun événement trouvé avec ces critères.</p>
          </div>
        )}

        {/* Section d'action */}
        <div className="text-center mt-12 space-y-6">
          <div className="bg-gradient-to-r from-violet-100 to-purple-100 p-8 rounded-3xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              🎉 Vous organisez un événement ?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Faites connaître votre événement sur UJAMAA et attirez plus de participants de toutes les îles.
            </p>
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/auth'}
              className="bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-500 text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:shadow-purple-500/50 transition-all hover:scale-105"
            >
              ✨ Ajouter mon événement
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EventsPage;
