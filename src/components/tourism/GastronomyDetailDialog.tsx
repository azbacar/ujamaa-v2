import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MapPin, Eye, Star, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MenuItemsManager from './MenuItemsManager';
import RecipeIngredientsManager from './RecipeIngredientsManager';
import SocialShareButtons from '@/components/SocialShareButtons';
import ContactDisplay from '@/components/ContactDisplay';
import { useViewTracker } from '@/hooks/useViewTracker';

interface GastronomyItem {
  id: string;
  author_id?: string | null;
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
  service_mode?: string | null;
  room_types?: any[];
  users?: { username: string; account_type: string } | null;
}

interface Props {
  item: GastronomyItem | null;
  open: boolean;
  onClose: () => void;
}

const DINING_LABELS: Record<string, string> = {
  'fast-food': '🍔 Fast-food',
  'sur-table': '🍽️ Sur table',
  'mixte': '🍔🍽️ Mixte',
  'buffet': '🍴 Buffet',
  'traiteur': '👨‍🍳 Traiteur',
};

const SERVICE_MODE_LABELS: Record<string, string> = {
  'sur-place': '🍽️ Sur place uniquement',
  'emporter': '📦 À emporter uniquement',
  'les-deux': '🍽️📦 Sur place & À emporter',
};

const ACCOMMODATION_LABELS: Record<string, string> = {
  'hotel': '🏨 Hôtel',
  'villa': '🏡 Villa',
  'auberge': '🛏️ Auberge',
  'chambre-hote': '🏠 Chambre d\'hôte',
  'appartement': '🏢 Appartement',
  'bungalow': '🏖️ Bungalow',
};

export default function GastronomyDetailDialog({ item, open, onClose }: Props) {
  // Tracker les vues seulement quand le dialog est ouvert
  useViewTracker('gastronomy', open ? item?.id : undefined);

  if (!item) return null;
  const isPro = item.users?.account_type === 'pro' || item.users?.account_type === 'enterprise';
  const isRestaurant = item.type === 'restaurant_dish';
  const isRecipe = item.type === 'recipe';
  const isHotel = item.type === 'hotel_room';
  const isAccommodation = item.type === 'private_room';


  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{item.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Images */}
          {item.images && item.images.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {item.images.map((img, i) => (
                <img key={i} src={img} alt={`${item.title} ${i + 1}`} className="rounded-lg w-full h-40 object-cover" />
              ))}
            </div>
          )}

          {/* Description */}
          <p className="text-sm text-muted-foreground">{item.description}</p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {item.category && <Badge variant="outline">{item.category}</Badge>}
            {item.dining_style && (
              <Badge variant="secondary">{DINING_LABELS[item.dining_style] || item.dining_style}</Badge>
            )}
            {item.service_mode && (
              <Badge variant="secondary">{SERVICE_MODE_LABELS[item.service_mode] || item.service_mode}</Badge>
            )}
            {item.accommodation_type && (
              <Badge variant="secondary">{ACCOMMODATION_LABELS[item.accommodation_type] || item.accommodation_type}</Badge>
            )}
            {isPro && (
              <Badge className="bg-amber-100 text-amber-700">
                <Star className="h-3 w-3 mr-1" /> PRO
              </Badge>
            )}
          </div>

          {/* Prices */}
          {(item.price_min || item.price_max) && (
            <div className="p-3 rounded-lg bg-primary/5 border">
              <p className="font-semibold text-primary">
                {item.price_min && item.price_max && item.price_min !== item.price_max
                  ? `${item.price_min.toLocaleString()} - ${item.price_max.toLocaleString()} KMF`
                  : `${(item.price_min || item.price_max)?.toLocaleString()} KMF`}
              </p>
            </div>
          )}

          {/* Room types for hotels/accommodations */}
          {(isHotel || isAccommodation) && item.room_types && (item.room_types as any[]).length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">
                {isHotel ? '🛏️ Types de chambres' : '🏠 Types d\'hébergement'}
              </h4>
              <div className="space-y-2">
                {(item.room_types as any[]).map((rt: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">{rt.name}</p>
                      {rt.description && <p className="text-xs text-muted-foreground">{rt.description}</p>}
                    </div>
                    <p className="font-semibold text-sm text-primary whitespace-nowrap">
                      {rt.price_min === rt.price_max || !rt.price_max
                        ? `${(rt.price_min || 0).toLocaleString()} KMF`
                        : `${(rt.price_min || 0).toLocaleString()} - ${(rt.price_max || 0).toLocaleString()} KMF`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Restaurant menu */}
          {isRestaurant && <MenuItemsManager gastronomyItemId={item.id} readOnly />}

          {/* Recipe ingredients */}
          {isRecipe && <RecipeIngredientsManager gastronomyItemId={item.id} readOnly />}

          {/* Location & Map */}
          {item.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {item.location}
            </div>
          )}

          {item.latitude && item.longitude && (
            <div className="space-y-2">
              <iframe
                title="Localisation"
                width="100%"
                height="200"
                style={{ border: 0, borderRadius: '0.5rem' }}
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${item.longitude - 0.005},${item.latitude - 0.005},${item.longitude + 0.005},${item.latitude + 0.005}&layer=mapnik&marker=${item.latitude},${item.longitude}`}
              />
              <a
                href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="w-full">
                  <Navigation className="h-3 w-3 mr-1" /> Ouvrir dans Google Maps
                </Button>
              </a>
            </div>
          )}

          {/* Contact (gating unifié : visiteur → login, non-Pro → upgrade) */}
          <div className="pt-3 border-t">
            <ContactDisplay
              authorId={item.author_id}
              phone={item.contact_phone}
              email={item.contact_email}
              whatsapp={item.contact_whatsapp}
              variant="card"
            />
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Eye className="h-3 w-3" /> {item.views} vues
          </p>

          {/* Share buttons */}
          <SocialShareButtons title={item.title} description={item.description} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
