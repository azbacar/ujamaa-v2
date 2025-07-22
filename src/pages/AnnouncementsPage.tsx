import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, MapPin, User, ArrowRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { announcements } from '@/components/AnnouncementsSection';

interface Announcement {
  id: number;
  title: string;
  category: string;
  description: string;
  location: string;
  date: string;
  author: string;
  type: 'urgent' | 'normal' | 'featured';
  price?: string;
}


const AnnouncementsPage = () => {
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || announcement.category === selectedCategory;
    const matchesType = selectedType === 'all' || announcement.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

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

        {/* Liste des annonces */}
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
                  {announcement.description}
                </p>

                {announcement.price && (
                  <div className="bg-gradient-to-r from-magenta-50 to-magenta-100 p-3 rounded-lg mb-4">
                    <p className="text-magenta-700 font-semibold text-sm">{announcement.price}</p>
                  </div>
                )}

                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    <span>{announcement.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>{announcement.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    <span>{announcement.author}</span>
                  </div>
                </div>

                <Link to={`/annonce/${announcement.id}`}>
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

        {filteredAnnouncements.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucune annonce trouvée avec ces critères.</p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default AnnouncementsPage;