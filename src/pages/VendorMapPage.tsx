import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/components/LanguageProvider';
import { useLiveVendorLocations } from '@/hooks/useVendorLocation';
import { usePublicPartners } from '@/hooks/usePartner';
import { useAuth } from '@/hooks/useAuth';
import { authPath } from '@/lib/authRedirect';
import { usePageSEO } from '@/hooks/usePageSEO';
import { MapPin, Radio, Navigation, MessageCircle, LogIn, Handshake, Phone } from 'lucide-react';

// Fix default marker icon in Leaflet + Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const mobileIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:36px;height:36px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(16,185,129,.25);animation:ujamaaPulse 2s infinite;"></div>
    <div style="position:absolute;top:6px;left:6px;width:24px;height:24px;border-radius:50%;background:#10b981;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);"></div>
  </div>
  <style>@keyframes ujamaaPulse{0%{transform:scale(.8);opacity:1}100%{transform:scale(2);opacity:0}}</style>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const fixedIcon = L.divIcon({
  className: '',
  html: `<div style="width:30px;height:30px;border-radius:6px;background:#0ea5e9;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:14px;">⌂</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const ISLANDS = ['Grande Comore', 'Anjouan', 'Mohéli', 'Mayotte'];
const ISLAND_CENTER: Record<string, [number, number]> = {
  'Grande Comore': [-11.7, 43.25],
  'Anjouan': [-12.2, 44.4],
  'Mohéli': [-12.3, 43.75],
  'Mayotte': [-12.83, 45.17],
};

export default function VendorMapPage() {
  const { currentLanguage, setLanguage } = useLanguage();
  const [islandFilter, setIslandFilter] = useState<string>('all');
  const { locations, loading } = useLiveVendorLocations(islandFilter === 'all' ? undefined : islandFilter);
  const { user } = useAuth();

  usePageSEO({
    title: 'Carte des vendeurs en direct',
    description: 'Suivez en temps réel la position des vendeurs ambulants et commerçants Pro de l\'archipel des Comores. Trouvez le marché ou le vendeur le plus proche de vous.',
    keywords: 'carte vendeurs Comores, géolocalisation, vendeurs ambulants, marché en direct, Mohéli, Anjouan, Grande Comore, Mayotte',
    canonicalPath: '/carte-vendeurs',
  });

  const center = useMemo<[number, number]>(() => {
    if (islandFilter !== 'all' && ISLAND_CENTER[islandFilter]) return ISLAND_CENTER[islandFilter];
    if (locations.length > 0) return [locations[0].latitude, locations[0].longitude];
    return [-11.875, 43.872]; // centre archipel
  }, [islandFilter, locations]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const map = (window as any).__ujamaaMap as L.Map | undefined;
        if (map) map.setView([pos.coords.latitude, pos.coords.longitude], 15);
      },
      () => {}
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
      <main className="flex-1">
        <div className="container mx-auto px-3 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <Radio className="h-7 w-7 text-emerald-600 animate-pulse" />
                Carte des vendeurs en direct
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {locations.length} vendeur{locations.length > 1 ? 's' : ''} actuellement en ligne
              </p>
            </div>
            <div className="flex gap-2">
              <Select value={islandFilter} onValueChange={setIslandFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les îles</SelectItem>
                  {ISLANDS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={handleLocateMe} title="Me localiser">
                <Navigation className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div style={{ height: '70vh', minHeight: 400 }}>
                <MapContainer
                  center={center}
                  zoom={islandFilter !== 'all' ? 11 : 9}
                  style={{ height: '100%', width: '100%' }}
                  whenReady={() => {
                    setTimeout(() => {
                      const containers = document.querySelectorAll('.leaflet-container');
                      containers.forEach((c: any) => {
                        if (c._leaflet_map) (window as any).__ujamaaMap = c._leaflet_map;
                      });
                    }, 100);
                  }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {locations.map((loc) => (
                    <Marker key={loc.id} position={[loc.latitude, loc.longitude]} icon={loc.is_mobile ? mobileIcon : fixedIcon}>
                      <Popup>
                        <div className="space-y-1">
                          <div className="font-semibold flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-emerald-600" /> {loc.label}
                          </div>
                          <Badge variant={loc.is_mobile ? 'default' : 'secondary'} className="text-[10px]">
                            {loc.is_mobile ? '🚚 Ambulant — en direct' : '🏪 Position fixe'}
                          </Badge>
                          {loc.category && <Badge variant="outline" className="ml-1">{loc.category}</Badge>}
                          {loc.address && <p className="text-xs text-muted-foreground">📍 {loc.address}</p>}
                          {loc.island && <p className="text-xs text-muted-foreground">🏝️ {loc.island}</p>}
                          <p className="text-xs text-muted-foreground">
                            Mis à jour : {new Date(loc.last_seen_at).toLocaleTimeString('fr-FR')}
                          </p>
                          <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-border/40">
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-xs text-emerald-700 underline inline-flex items-center gap-1"
                            >
                              <Navigation className="h-3 w-3" /> Itinéraire Google Maps
                            </a>
                            {user ? (
                              user.id !== loc.user_id ? (
                                <Link
                                  to={`/messages/${loc.user_id}`}
                                  className="inline-flex items-center justify-center gap-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-md transition-colors"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                  Demander la position exacte
                                </Link>
                              ) : (
                                <span className="text-[11px] text-muted-foreground italic">C'est votre annonce</span>
                              )
                            ) : (
                              <Link
                                to={authPath('/carte-vendeurs')}
                                className="inline-flex items-center justify-center gap-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-md transition-colors"
                              >
                                <LogIn className="h-3.5 w-3.5" />
                                Se connecter pour contacter
                              </Link>
                            )}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </CardContent>
          </Card>

          {!loading && locations.length === 0 && (
            <p className="text-center text-muted-foreground mt-6">
              Aucun vendeur en direct pour le moment. Revenez bientôt !
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
