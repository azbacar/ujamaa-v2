import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { UtensilsCrossed, Hotel, Home, ChefHat, Plus, MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import TourismSubmissionForm from '@/components/TourismSubmissionForm';
import { toast } from 'sonner';

type GastronomyType = 'recipe' | 'restaurant_dish' | 'hotel_room' | 'private_room';

interface GastronomyItem {
  id: string;
  type: GastronomyType;
  title: string;
  description: string;
  price_min?: number;
  price_max?: number;
  images?: string[];
  contact_phone?: string;
  contact_email?: string;
  contact_whatsapp?: string;
  location?: string;
  category?: string;
  views: number;
  author_id: string;
  users?: {
    username: string;
    account_type: 'free' | 'pro';
  };
}

const TourismPage = () => {
  const { user } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();
  const [items, setItems] = useState<GastronomyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<GastronomyType | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [activeType]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('gastronomy_items')
        .select(`
          *,
          users (
            username,
            account_type
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (activeType !== 'all') {
        query = query.eq('type', activeType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching gastronomy items:', error);
      toast.error('Erreur lors du chargement des annonces');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: GastronomyType) => {
    switch (type) {
      case 'recipe':
        return <ChefHat className="h-5 w-5" />;
      case 'restaurant_dish':
        return <UtensilsCrossed className="h-5 w-5" />;
      case 'hotel_room':
        return <Hotel className="h-5 w-5" />;
      case 'private_room':
        return <Home className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: GastronomyType) => {
    switch (type) {
      case 'recipe':
        return 'Recette';
      case 'restaurant_dish':
        return 'Plat Restaurant';
      case 'hotel_room':
        return 'Chambre Hôtel';
      case 'private_room':
        return 'Chambre Particulier';
    }
  };

  const canShowContact = (item: GastronomyItem) => {
    return item.users?.account_type === 'pro';
  };

  const formatPrice = (min?: number, max?: number) => {
    if (!min && !max) return 'Prix non spécifié';
    if (min && max && min !== max) return `${min} - ${max} KMF`;
    return `${min || max} KMF`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
      <main className="container mx-auto px-4 py-8 mt-20">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Section Tourisme</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Découvrez des restaurants, hôtels et hébergements aux Comores
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <Tabs value={activeType} onValueChange={(v) => setActiveType(v as GastronomyType | 'all')} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="all">Tout</TabsTrigger>
                <TabsTrigger value="recipe">Recettes</TabsTrigger>
                <TabsTrigger value="restaurant_dish">Restaurants</TabsTrigger>
                <TabsTrigger value="hotel_room">Hôtels</TabsTrigger>
                <TabsTrigger value="private_room">Particuliers</TabsTrigger>
              </TabsList>
            </Tabs>

            {user && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Publier une annonce
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <TourismSubmissionForm 
                    onClose={() => {
                      setDialogOpen(false);
                      fetchItems();
                    }} 
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Aucune annonce disponible pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {getTypeIcon(item.type)}
                      {getTypeLabel(item.type)}
                    </Badge>
                    {item.users?.account_type === 'pro' && (
                      <Badge variant="default">PRO</Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {item.category && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold">Catégorie:</span> {item.category}
                    </p>
                  )}
                  
                  {(item.price_min || item.price_max) && (
                    <p className="text-lg font-semibold text-primary">
                      {formatPrice(item.price_min, item.price_max)}
                    </p>
                  )}

                  {item.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {item.location}
                    </div>
                  )}

                  {canShowContact(item) ? (
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-sm font-semibold">Informations de contact:</p>
                      {item.contact_phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4" />
                          <a href={`tel:${item.contact_phone}`} className="hover:underline">
                            {item.contact_phone}
                          </a>
                        </div>
                      )}
                      {item.contact_email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4" />
                          <a href={`mailto:${item.contact_email}`} className="hover:underline">
                            {item.contact_email}
                          </a>
                        </div>
                      )}
                      {item.contact_whatsapp && (
                        <div className="flex items-center gap-2 text-sm">
                          <MessageCircle className="h-4 w-4" />
                          <a 
                            href={`https://wa.me/${item.contact_whatsapp.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            WhatsApp
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground italic">
                        Compte Pro requis pour afficher les informations de contact
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground">
                  Par {item.users?.username} • {item.views} vues
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default TourismPage;
