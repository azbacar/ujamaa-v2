import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { MapPin, User, Calendar, TrendingUp, TrendingDown, Store, Tag, Package, Navigation, Clock } from 'lucide-react';
import SocialShareButtons from '@/components/SocialShareButtons';
import PriceHistoryChart from '@/components/PriceHistoryChart';
import ProFeaturesGate from '@/components/ProFeaturesGate';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface PriceData {
  id: string;
  product: string;
  category: string;
  price: number;
  currency: string;
  vendor: string;
  location: {
    village: string | null;
    city: string;
    region: string | null;
    island: string;
  };
  market: string;
  created_at: string;
  trend: 'up' | 'down' | 'stable';
  unit: string;
  image_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  merchant_type?: string | null;
  geo_expires_at?: string | null;
}

interface PriceDetailDialogProps {
  price: PriceData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PriceDetailDialog({ price, open, onOpenChange }: PriceDetailDialogProps) {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from('users').select('account_type').eq('id', user.id).single().then(({ data }) => {
        setIsPro(data?.account_type === 'pro');
      });
    }
  }, [user]);

  if (!price) return null;

  const trendLabel = price.trend === 'up' ? 'En hausse' : price.trend === 'down' ? 'En baisse' : 'Stable';
  const trendColor = price.trend === 'up' ? 'text-red-600 bg-red-50 border-red-200' : price.trend === 'down' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-blue-600 bg-blue-50 border-blue-200';
  const trendIcon = price.trend === 'up' ? <TrendingUp className="w-5 h-5" /> : price.trend === 'down' ? <TrendingDown className="w-5 h-5" /> : null;

  const hasGeo = price.latitude && price.longitude;
  const isAmbulant = price.merchant_type === 'ambulant';
  const geoExpired = isAmbulant && price.geo_expires_at && new Date(price.geo_expires_at) < new Date();
  const showGeo = hasGeo && !geoExpired;

  const getGeoExpiryLabel = () => {
    if (!isAmbulant || !price.geo_expires_at) return null;
    const expires = new Date(price.geo_expires_at);
    const now = new Date();
    if (expires < now) return 'Position expirée';
    const diffH = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60));
    if (diffH <= 1) return 'Expire dans moins d\'1h';
    if (diffH < 24) return `Expire dans ${diffH}h`;
    return `Expire dans ${Math.ceil(diffH / 24)} jour(s)`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-600" />
            {price.product}
          </DialogTitle>
          <DialogDescription className="sr-only">Détail du prix de {price.product}</DialogDescription>
        </DialogHeader>

        {/* Product image */}
        {price.image_url && (
          <div className="rounded-xl overflow-hidden border">
            <img src={price.image_url} alt={price.product} className="w-full h-48 object-cover" />
          </div>
        )}

        {/* Price highlight */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6 text-center">
          <p className="text-4xl font-black text-emerald-700">
            {price.price.toLocaleString('fr-FR')} {price.currency}
          </p>
          <p className="text-muted-foreground mt-1">par {price.unit}</p>
          <div className="mt-3 flex justify-center">
            <Badge variant="outline" className={`${trendColor} gap-1 text-sm px-3 py-1`}>
              {trendIcon}
              {trendLabel}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Details */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailRow icon={<Tag className="h-4 w-4 text-emerald-600" />} label="Catégorie" value={price.category} />
            <DetailRow icon={<User className="h-4 w-4 text-emerald-600" />} label="Vendeur" value={price.vendor} />
            <DetailRow icon={<Store className="h-4 w-4 text-emerald-600" />} label="Marché" value={price.market} />
            <DetailRow icon={<Calendar className="h-4 w-4 text-emerald-600" />} label="Dernière mise à jour" value={new Date(price.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} />
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Localisation
            </h4>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Île</span>
                <span className="text-sm font-medium">{price.location.island}</span>
              </div>
              {price.location.region && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Région</span>
                  <span className="text-sm font-medium">{price.location.region}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ville</span>
                <span className="text-sm font-medium">{price.location.city}</span>
              </div>
              {price.location.village && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Village</span>
                  <span className="text-sm font-medium">{price.location.village}</span>
                </div>
              )}
            </div>
          </div>

          {/* Geolocation map preview */}
          {showGeo && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-emerald-700 flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  📍 {isAmbulant ? 'Position du marchand ambulant' : 'Emplacement du vendeur'}
                </h4>
                {isAmbulant && (
                  <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50 gap-1">
                    <Clock className="h-3 w-3" />
                    {getGeoExpiryLabel()}
                  </Badge>
                )}
              </div>
              
              {/* Map embed */}
              <div className="rounded-xl overflow-hidden border-2 border-emerald-200 shadow-sm">
                <iframe
                  title="Position du vendeur"
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${price.longitude! - 0.008},${price.latitude! - 0.008},${price.longitude! + 0.008},${price.latitude! + 0.008}&layer=mapnik&marker=${price.latitude},${price.longitude}`}
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${price.latitude},${price.longitude}`, '_blank')}
                >
                  <Navigation className="h-4 w-4 mr-1" />
                  Itinéraire
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => window.open(`https://www.google.com/maps?q=${price.latitude},${price.longitude}`, '_blank')}
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  Google Maps
                </Button>
              </div>
            </div>
          )}

          {/* Geo expired notice */}
          {hasGeo && geoExpired && (
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" />
                La position de ce marchand ambulant a expiré
              </p>
            </div>
          )}

          {/* Price history chart - Pro feature */}
          <ProFeaturesGate feature="L'historique complet des prix" isPro={isPro}>
            <PriceHistoryChart
              priceId={price.id}
              productName={price.product}
              currentPrice={price.price}
              currency={price.currency}
            />
          </ProFeaturesGate>

          <SocialShareButtons title={`${price.product} — ${price.price} ${price.currency}/${price.unit}`} description={`Prix à ${price.location.island}`} className="pt-2" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
