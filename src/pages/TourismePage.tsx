import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/components/LanguageProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  UtensilsCrossed, Hotel, Home, ChefHat, Search, MapPin, Eye, 
  Phone, MessageCircle, Mail, Star, Navigation
} from 'lucide-react';
import { usePageSEO } from '@/hooks/usePageSEO';
import GastronomyDetailDialog from '@/components/tourism/GastronomyDetailDialog';

interface GastronomyItem {
  id: string;
  type: string;
  title: string;
  description: string;
  price_min?: number | null;
  price_max?: number | null;
  images?: string[] | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  contact_whatsapp?: string | null;
  location?: string | null;
  category?: string | null;
  views: number;
  created_at: string;
  latitude?: number | null;
  longitude?: number | null;
  dining_style?: string | null;
  accommodation_type?: string | null;
  room_types?: any[];
  users?: { username: string; account_type: string } | null;
}

const TYPE_CONFIG: Record<string, { label: string; icon: typeof ChefHat; color: string }> = {
  recipe: { label: 'Recette', icon: ChefHat, color: 'bg-orange-100 text-orange-700' },
  restaurant_dish: { label: 'Restaurant', icon: UtensilsCrossed, color: 'bg-green-100 text-green-700' },
  hotel_room: { label: 'Hôtel', icon: Hotel, color: 'bg-blue-100 text-blue-700' },
  private_room: { label: 'Hébergement', icon: Home, color: 'bg-purple-100 text-purple-700' },
};

const DINING_LABELS: Record<string, string> = {
  'fast-food': '🍔 Fast-food',
  'sur-table': '🍽️ Sur table',
  'mixte': '🍔🍽️ Mixte',
};

const ACCOMMODATION_LABELS: Record<string, string> = {
  'hotel': '🏨 Hôtel',
  'villa': '🏡 Villa',
  'auberge': '🛏️ Auberge',
  'chambre-hote': '🏠 Chambre d\'hôte',
  'appartement': '🏢 Appartement',
  'bungalow': '🏖️ Bungalow',
};

export default function TourismePage() {
  const { currentLanguage, setLanguage } = useLanguage();
  const [items, setItems] = useState<GastronomyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedItem, setSelectedItem] = useState<GastronomyItem | null>(null);

  usePageSEO({
    canonicalPath: '/tourisme',
    keywords: 'tourisme Comores, restaurants, hôtels, hébergement, recettes comoriennes',
  });

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('gastronomy_items')
        .select('id, type, title, description, price_min, price_max, images, contact_phone, contact_email, contact_whatsapp, location, category, views, created_at, latitude, longitude, dining_style, accommodation_type, room_types, users:author_id(username, account_type)')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      setItems((data as any) || []);
      setLoading(false);
    };
    fetchItems();
  }, []);

  const filtered = items.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = selectedType === 'all' || item.type === selectedType;
    return matchSearch && matchType;
  });

  const stats = {
    recipes: items.filter(i => i.type === 'recipe').length,
    restaurants: items.filter(i => i.type === 'restaurant_dish').length,
    hotels: items.filter(i => i.type === 'hotel_room').length,
    rooms: items.filter(i => i.type === 'private_room').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
      
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Hero */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            🏝️ Tourisme & Gastronomie
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Découvrez les saveurs, restaurants, hôtels et hébergements des Comores
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Recettes', count: stats.recipes, icon: ChefHat, color: 'text-orange-500' },
            { label: 'Restaurants', count: stats.restaurants, icon: UtensilsCrossed, color: 'text-green-500' },
            { label: 'Hôtels', count: stats.hotels, icon: Hotel, color: 'text-blue-500' },
            { label: 'Hébergements', count: stats.rooms, icon: Home, color: 'text-purple-500' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={`h-6 w-6 ${s.color}`} />
                <div>
                  <p className="text-xl font-bold">{s.count}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher un lieu, plat, hôtel..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="recipe">🍳 Recettes</SelectItem>
              <SelectItem value="restaurant_dish">🍽️ Restaurants</SelectItem>
              <SelectItem value="hotel_room">🏨 Hôtels</SelectItem>
              <SelectItem value="private_room">🏠 Hébergements</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Items grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground mt-2">Chargement...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Aucun résultat trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(item => {
              const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.recipe;
              const Icon = cfg.icon;
              const isPro = item.users?.account_type === 'pro' || item.users?.account_type === 'enterprise';

              return (
                <Card 
                  key={item.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                >
                  {/* Image */}
                  {item.images?.[0] ? (
                    <div className="aspect-video relative overflow-hidden">
                      <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                      <Badge className={`absolute top-2 left-2 ${cfg.color}`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {cfg.label}
                      </Badge>
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center relative">
                      <Icon className="h-12 w-12 text-muted-foreground/20" />
                      <Badge className={`absolute top-2 left-2 ${cfg.color}`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {cfg.label}
                      </Badge>
                    </div>
                  )}

                  <CardContent className="p-4 space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground line-clamp-2">{item.title}</h3>
                        {isPro && (
                          <Badge variant="secondary" className="shrink-0 text-xs bg-amber-100 text-amber-700">
                            <Star className="h-3 w-3 mr-0.5" /> PRO
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                    </div>

                    {/* Extra badges */}
                    <div className="flex flex-wrap gap-1">
                      {item.dining_style && (
                        <Badge variant="outline" className="text-xs">
                          {DINING_LABELS[item.dining_style] || item.dining_style}
                        </Badge>
                      )}
                      {item.accommodation_type && (
                        <Badge variant="outline" className="text-xs">
                          {ACCOMMODATION_LABELS[item.accommodation_type] || item.accommodation_type}
                        </Badge>
                      )}
                    </div>

                    {/* Price */}
                    {(item.price_min || item.price_max) && (
                      <p className="text-sm font-semibold text-primary">
                        {item.price_min && item.price_max && item.price_min !== item.price_max
                          ? `${item.price_min.toLocaleString()} - ${item.price_max.toLocaleString()} KMF`
                          : `${(item.price_min || item.price_max)?.toLocaleString()} KMF`}
                      </p>
                    )}

                    {/* Location */}
                    {item.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {item.location}
                        {item.latitude && item.longitude && (
                          <Navigation className="h-3 w-3 ml-1 text-primary" />
                        )}
                      </p>
                    )}

                    {/* Contact - visible if author is pro */}
                    {isPro ? (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                        {item.contact_phone && (
                          <a href={`tel:${item.contact_phone}`} onClick={e => e.stopPropagation()} className="text-xs flex items-center gap-1 text-primary hover:underline">
                            <Phone className="h-3 w-3" /> {item.contact_phone}
                          </a>
                        )}
                        {item.contact_whatsapp && (
                          <a href={`https://wa.me/${item.contact_whatsapp}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-xs flex items-center gap-1 text-green-600 hover:underline">
                            <MessageCircle className="h-3 w-3" /> WhatsApp
                          </a>
                        )}
                        {item.contact_email && (
                          <a href={`mailto:${item.contact_email}`} onClick={e => e.stopPropagation()} className="text-xs flex items-center gap-1 text-blue-600 hover:underline">
                            <Mail className="h-3 w-3" /> Email
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground italic">
                          Annonceur non vérifié — les annonceurs Pro affichent leurs coordonnées
                        </p>
                      </div>
                    )}

                    {/* Views */}
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {item.views} vues
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Detail Dialog */}
      <GastronomyDetailDialog 
        item={selectedItem}
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      <Footer />
    </div>
  );
}
