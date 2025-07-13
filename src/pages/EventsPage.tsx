import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Clock, Users, Search } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  island: string;
  category: string;
  organizer: string;
  attendees: number;
  status: 'upcoming' | 'ongoing' | 'completed';
}

const EventsPage = () => {
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIsland, setSelectedIsland] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const events: Event[] = [
    {
      id: 1,
      title: "Festival Culturel de Moroni",
      description: "Célébration de la culture comorienne avec danses traditionnelles, musique et artisanat local",
      date: "2024-02-15",
      time: "14:00",
      location: "Place de l'Indépendance",
      island: "Grande Comore",
      category: "Culturel",
      organizer: "Ministère de la Culture",
      attendees: 2000,
      status: "upcoming"
    },
    {
      id: 2,
      title: "Conférence sur l'Agriculture Durable",
      description: "Forum sur les techniques agricoles modernes et durables aux Comores",
      date: "2024-02-20",
      time: "09:00",
      location: "Centre de Conférences",
      island: "Anjouan",
      category: "Éducation",
      organizer: "Chambre d'Agriculture",
      attendees: 150,
      status: "upcoming"
    },
    {
      id: 3,
      title: "Tournoi de Football Inter-îles",
      description: "Compétition sportive rassemblant les équipes des quatre îles",
      date: "2024-02-25",
      time: "15:30",
      location: "Stade National",
      island: "Mohéli",
      category: "Sport",
      organizer: "Fédération Comorienne de Football",
      attendees: 5000,
      status: "upcoming"
    },
    {
      id: 4,
      title: "Salon de l'Artisanat Local",
      description: "Exposition et vente d'objets d'artisanat traditionnel comorien",
      date: "2024-03-01",
      time: "10:00",
      location: "Marché Central",
      island: "Mayotte",
      category: "Commerce",
      organizer: "Association des Artisans",
      attendees: 800,
      status: "upcoming"
    },
    {
      id: 5,
      title: "Séminaire sur le Tourisme Durable",
      description: "Développement du tourisme respectueux de l'environnement",
      date: "2024-03-05",
      time: "08:30",
      location: "Hôtel des Îles",
      island: "Grande Comore",
      category: "Business",
      organizer: "Office National du Tourisme",
      attendees: 120,
      status: "upcoming"
    }
  ];

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIsland = selectedIsland === 'all' || event.island === selectedIsland;
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    
    return matchesSearch && matchesIsland && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
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
    <div className="min-h-screen">
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
                      <p className="text-sm text-gray-600 mt-1">{event.organizer}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(event.status)}>
                    {event.status === 'upcoming' ? 'À venir' : 
                     event.status === 'ongoing' ? 'En cours' : 'Terminé'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-gray-700">{event.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>{new Date(event.date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>{event.attendees} participants</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4">
                  <Badge variant="outline" className="text-emerald-700 border-emerald-300">
                    📍 {event.island}
                  </Badge>
                  <Button variant="outline" size="sm">
                    Voir détails
                  </Button>
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