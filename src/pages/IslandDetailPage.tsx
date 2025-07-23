import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Search, MapPin, Calendar, DollarSign, Building, Clock, Phone, Mail } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/components/LanguageProvider';

interface IslandData {
  name: string;
  nameLocal: string;
  description: string;
  population: string;
  capital: string;
  area: string;
  specialties: string[];
  image: string;
}

interface PriceData {
  id: number;
  product: string;
  category: string;
  price: number;
  currency: string;
  vendor: string;
  location: string;
  market: string;
  lastUpdated: string;
  trend: 'up' | 'down' | 'stable';
}

interface EventData {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  organizer: string;
}

interface ServiceData {
  id: number;
  name: string;
  description: string;
  category: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
}

interface AnnouncementData {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  organization: string;
}

const IslandDetailPage = () => {
  const { islandName } = useParams();
  const { t } = useLanguage();
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const islandData: Record<string, IslandData> = {
    'grande-comore': {
      name: 'Grande Comore',
      nameLocal: 'Ngazidja',
      description: 'La plus grande île de l\'archipel des Comores, abritant la capitale Moroni et le volcan actif Karthala.',
      population: '400,000 habitants',
      capital: 'Moroni',
      area: '1,148 km²',
      specialties: ['Ylang-ylang', 'Vanille', 'Pêche', 'Administration'],
      image: 'https://images.unsplash.com/photo-1544966503-7fdb24ac2dca?auto=format&fit=crop&w=800&q=80'
    },
    'anjouan': {
      name: 'Anjouan',
      nameLocal: 'Ndzuwani',
      description: 'L\'île aux parfums, réputée pour sa production d\'ylang-ylang et ses paysages montagneux.',
      population: '350,000 habitants',
      capital: 'Mutsamudu',
      area: '424 km²',
      specialties: ['Ylang-ylang', 'Girofle', 'Vanille', 'Agriculture'],
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=800&q=80'
    },
    'moheli': {
      name: 'Mohéli',
      nameLocal: 'Mwali',
      description: 'La plus petite île habitée, connue pour son parc marin national et son écotourisme.',
      population: '50,000 habitants',
      capital: 'Fomboni',
      area: '290 km²',
      specialties: ['Écotourisme', 'Pêche durable', 'Agriculture biologique', 'Conservation'],
      image: 'https://images.unsplash.com/photo-1571041804726-53fb982d8c81?auto=format&fit=crop&w=800&q=80'
    },
    'mayotte': {
      name: 'Mayotte',
      nameLocal: 'Maore',
      description: 'L\'île au lagon, quatrième île de l\'archipel des Comores avec un statut administratif spécial.',
      population: '310,000 habitants',
      capital: 'Mamoudzou',
      area: '374 km²',
      specialties: ['Lagon', 'Tourisme', 'Pêche', 'Services'],
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80'
    }
  };

  // Données de démonstration - à remplacer par des vraies données
  const mockPrices: PriceData[] = [
    {
      id: 1,
      product: "Riz blanc importé",
      category: "Céréales",
      price: 1500,
      currency: islandName === 'mayotte' ? 'EUR' : 'FC',
      vendor: "Mama Hadija",
      location: "Moroni Centre",
      market: "Marché Central",
      lastUpdated: "2024-01-15",
      trend: "down"
    },
    {
      id: 2,
      product: "Bananes locales",
      category: "Fruits",
      price: 500,
      currency: islandName === 'mayotte' ? 'EUR' : 'FC',
      vendor: "Ahmed Soilihi",
      location: "Marché local",
      market: "Marché quotidien",
      lastUpdated: "2024-01-15",
      trend: "stable"
    }
  ];

  const mockEvents: EventData[] = [
    {
      id: 1,
      title: "Festival Culturel Local",
      description: "Célébration de la culture locale avec danses et musique traditionnelles",
      date: "2024-02-15",
      location: "Centre culturel",
      category: "Culturel",
      organizer: "Municipalité"
    }
  ];

  const mockServices: ServiceData[] = [
    {
      id: 1,
      name: "Préfecture locale",
      description: "Services administratifs et documents officiels",
      category: "Administration",
      address: "Centre-ville",
      phone: "+269 73 10 89",
      email: "contact@prefecture.km",
      hours: "7h30 - 15h30"
    }
  ];

  const mockAnnouncements: AnnouncementData[] = [
    {
      id: 1,
      title: "Nouvelle infrastructure routière",
      excerpt: "Amélioration des routes principales de l'île",
      date: "2024-01-10",
      category: "Infrastructure",
      organization: "Ministère des Travaux Publics"
    }
  ];

  const currentIsland = islandName ? islandData[islandName] : null;

  const filteredData = useMemo(() => {
    const filterBySearch = (items: any[], searchFields: string[]) => {
      if (!searchTerm) return items;
      return items.filter(item => 
        searchFields.some(field => 
          item[field]?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    };

    const filterByCategory = (items: any[], categoryField: string) => {
      if (selectedCategory === 'all') return items;
      return items.filter(item => item[categoryField] === selectedCategory);
    };

    return {
      prices: filterByCategory(filterBySearch(mockPrices, ['product', 'vendor']), 'category'),
      events: filterByCategory(filterBySearch(mockEvents, ['title', 'description']), 'category'),
      services: filterByCategory(filterBySearch(mockServices, ['name', 'description']), 'category'),
      announcements: filterByCategory(filterBySearch(mockAnnouncements, ['title', 'excerpt']), 'category')
    };
  }, [searchTerm, selectedCategory]);

  if (!currentIsland) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50">
        <Header currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
        <main className="container mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Île non trouvée</h1>
            <Link to="/">
              <Button className="bg-gradient-to-r from-emerald-500 to-ocean-500">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50">
      <Header currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
      
      <main className="container mx-auto px-6 py-8">
        {/* En-tête de l'île */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="outline" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
          
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="relative h-64 md:h-80">
              <img 
                src={currentIsland.image} 
                alt={currentIsland.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <h1 className="text-4xl md:text-5xl font-black mb-2">
                  {currentIsland.name}
                </h1>
                <p className="text-xl font-medium opacity-90">
                  {currentIsland.nameLocal}
                </p>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-lg text-gray-700 mb-6">{currentIsland.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-emerald-800">Population</h3>
                  <p className="text-emerald-600">{currentIsland.population}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800">Capitale</h3>
                  <p className="text-blue-600">{currentIsland.capital}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800">Superficie</h3>
                  <p className="text-purple-600">{currentIsland.area}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-orange-800">Spécialités</h3>
                  <div className="flex flex-wrap gap-1">
                    {currentIsland.specialties.map((specialty, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres globaux */}
        <Card className="mb-8 glass-effect">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher..."
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
                  <SelectItem value="Céréales">Céréales</SelectItem>
                  <SelectItem value="Fruits">Fruits</SelectItem>
                  <SelectItem value="Culturel">Culturel</SelectItem>
                  <SelectItem value="Administration">Administration</SelectItem>
                  <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                </SelectContent>
              </Select>

              <Button className="bg-gradient-to-r from-emerald-500 to-ocean-500">
                Filtrer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Onglets de contenu */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="prices">Prix & Marchés</TabsTrigger>
            <TabsTrigger value="events">Événements</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="feature-card">
                <CardContent className="p-6 text-center">
                  <DollarSign className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                  <h3 className="font-bold text-lg mb-2">Prix & Marchés</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {filteredData.prices.length} produits disponibles
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab('prices')}
                  >
                    Voir les prix
                  </Button>
                </CardContent>
              </Card>

              <Card className="feature-card">
                <CardContent className="p-6 text-center">
                  <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-bold text-lg mb-2">Événements</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {filteredData.events.length} événements à venir
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab('events')}
                  >
                    Voir événements
                  </Button>
                </CardContent>
              </Card>

              <Card className="feature-card">
                <CardContent className="p-6 text-center">
                  <Building className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                  <h3 className="font-bold text-lg mb-2">Services</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {filteredData.services.length} services publics
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab('services')}
                  >
                    Voir services
                  </Button>
                </CardContent>
              </Card>

              <Card className="feature-card">
                <CardContent className="p-6 text-center">
                  <MapPin className="w-8 h-8 text-orange-600 mx-auto mb-3" />
                  <h3 className="font-bold text-lg mb-2">Annonces</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {filteredData.announcements.length} annonces récentes
                  </p>
                  <Button variant="outline" size="sm">
                    Voir annonces
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="prices" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredData.prices.map(price => (
                <Card key={price.id} className="feature-card card-hover">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{price.product}</h3>
                        <Badge variant="secondary" className="mt-1">
                          {price.category}
                        </Badge>
                      </div>
                      <Badge variant="outline" className={
                        price.trend === 'up' ? 'text-red-600' : 
                        price.trend === 'down' ? 'text-green-600' : 'text-blue-600'
                      }>
                        {price.trend === 'up' ? '↗️' : price.trend === 'down' ? '↘️' : '➡️'}
                      </Badge>
                    </div>
                    
                    <div className="bg-emerald-50 p-4 rounded-lg mb-4">
                      <p className="text-2xl font-black text-emerald-700">
                        {price.price} {price.currency}
                      </p>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{price.location}</span>
                      </div>
                      <p><strong>Vendeur:</strong> {price.vendor}</p>
                      <p><strong>Marché:</strong> {price.market}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <div className="space-y-4">
              {filteredData.events.map(event => (
                <Card key={event.id} className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2">{event.title}</h3>
                        <p className="text-gray-600 mb-4">{event.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(event.date).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{event.location}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">{event.category}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <div className="space-y-4">
              {filteredData.services.map(service => (
                <Card key={service.id} className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{service.name}</h3>
                        <Badge variant="outline" className="mt-1">{service.category}</Badge>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{service.description}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span>{service.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-emerald-600" />
                        <span>{service.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-emerald-600" />
                        <span>{service.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        <span>{service.hours}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default IslandDetailPage;