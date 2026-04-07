import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/components/LanguageProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, Cross, Search, MapPin, Phone, Clock, ArrowRight } from 'lucide-react';
import { usePageSEO } from '@/hooks/usePageSEO';

interface TaxiFare {
  id: string;
  from_location: string;
  to_location: string;
  island: string;
  price: number;
  currency: string;
  vehicle_type: string;
  notes: string | null;
}

interface PharmacyGuard {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  island: string;
  city: string | null;
  is_on_duty: boolean;
  duty_start: string | null;
  duty_end: string | null;
  notes: string | null;
}

export default function InfosPratiquesPage() {
  const { currentLanguage, setLanguage } = useLanguage();
  const [taxiFares, setTaxiFares] = useState<TaxiFare[]>([]);
  const [pharmacies, setPharmacies] = useState<PharmacyGuard[]>([]);
  const [loading, setLoading] = useState(true);
  const [taxiSearch, setTaxiSearch] = useState('');
  const [taxiIsland, setTaxiIsland] = useState('all');
  const [pharmaIsland, setPharmaIsland] = useState('all');
  const [pharmaFilter, setPharmaFilter] = useState('all');

  usePageSEO({
    title: 'Infos Pratiques - Taxis & Pharmacies de garde',
    description: 'Tarifs de taxi et pharmacies de garde aux Comores. Consultez les prix des trajets et trouvez la pharmacie ouverte près de chez vous.',
    canonicalPath: '/infos-pratiques',
    keywords: 'taxi Comores, tarif taxi, pharmacie de garde Comores, pharmacie ouverte',
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [taxiRes, pharmaRes] = await Promise.all([
        supabase.from('taxi_fares').select('*').eq('is_active', true).order('island').order('from_location'),
        supabase.from('pharmacy_guards').select('*').eq('is_active', true).order('island').order('name'),
      ]);
      setTaxiFares((taxiRes.data as any) || []);
      setPharmacies((pharmaRes.data as any) || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredTaxis = taxiFares.filter(t => {
    const matchSearch = t.from_location.toLowerCase().includes(taxiSearch.toLowerCase()) ||
                        t.to_location.toLowerCase().includes(taxiSearch.toLowerCase());
    const matchIsland = taxiIsland === 'all' || t.island === taxiIsland;
    return matchSearch && matchIsland;
  });

  const filteredPharmacies = pharmacies.filter(p => {
    const matchIsland = pharmaIsland === 'all' || p.island === pharmaIsland;
    const matchFilter = pharmaFilter === 'all' || (pharmaFilter === 'on_duty' && p.is_on_duty);
    return matchIsland && matchFilter;
  });

  const onDutyCount = pharmacies.filter(p => p.is_on_duty).length;

  const islandOptions = ['Grande Comore', 'Anjouan', 'Mohéli', 'Mayotte'];

  return (
    <div className="min-h-screen bg-background">
      <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Hero */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            📋 Infos Pratiques
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tarifs de taxi et pharmacies de garde aux Comores
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Car className="h-6 w-6 text-yellow-500" />
              <div>
                <p className="text-xl font-bold">{taxiFares.length}</p>
                <p className="text-xs text-muted-foreground">Trajets taxi</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Cross className="h-6 w-6 text-red-500" />
              <div>
                <p className="text-xl font-bold">{pharmacies.length}</p>
                <p className="text-xs text-muted-foreground">Pharmacies</p>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-6 w-6 text-green-500" />
              <div>
                <p className="text-xl font-bold">{onDutyCount}</p>
                <p className="text-xs text-muted-foreground">Pharmacies de garde</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="taxi" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="taxi" className="gap-2">
              <Car className="h-4 w-4" /> Tarifs Taxi
            </TabsTrigger>
            <TabsTrigger value="pharmacy" className="gap-2">
              <Cross className="h-4 w-4" /> Pharmacies de Garde
            </TabsTrigger>
          </TabsList>

          {/* TAXI TAB */}
          <TabsContent value="taxi" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher un trajet (ex: Moroni, Mitsamiouli...)"
                  value={taxiSearch}
                  onChange={e => setTaxiSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={taxiIsland} onValueChange={setTaxiIsland}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Île" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les îles</SelectItem>
                  {islandOptions.map(i => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              </div>
            ) : filteredTaxis.length === 0 ? (
              <div className="text-center py-12">
                <Car className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Aucun trajet trouvé</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTaxis.map(fare => (
                  <Card key={fare.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <span className="truncate">{fare.from_location}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{fare.to_location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {fare.island}
                        </Badge>
                        <span className="text-lg font-bold text-primary">
                          {fare.price.toLocaleString()} {fare.currency}
                        </span>
                      </div>
                      {fare.vehicle_type !== 'taxi' && (
                        <p className="text-xs text-muted-foreground capitalize">🚗 {fare.vehicle_type}</p>
                      )}
                      {fare.notes && (
                        <p className="text-xs text-muted-foreground italic">{fare.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* PHARMACY TAB */}
          <TabsContent value="pharmacy" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={pharmaIsland} onValueChange={setPharmaIsland}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Île" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les îles</SelectItem>
                  {islandOptions.map(i => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={pharmaFilter} onValueChange={setPharmaFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les pharmacies</SelectItem>
                  <SelectItem value="on_duty">🟢 De garde uniquement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              </div>
            ) : filteredPharmacies.length === 0 ? (
              <div className="text-center py-12">
                <Cross className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Aucune pharmacie trouvée</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPharmacies.map(pharma => {
                  const dutyStart = pharma.duty_start ? new Date(pharma.duty_start) : null;
                  const dutyEnd = pharma.duty_end ? new Date(pharma.duty_end) : null;

                  return (
                    <Card key={pharma.id} className={`hover:shadow-md transition-shadow ${pharma.is_on_duty ? 'border-green-400 border-2' : ''}`}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground">{pharma.name}</h3>
                          {pharma.is_on_duty ? (
                            <Badge className="bg-green-100 text-green-700 shrink-0">🟢 De garde</Badge>
                          ) : (
                            <Badge variant="secondary" className="shrink-0">Fermée</Badge>
                          )}
                        </div>

                        {pharma.address && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {pharma.address}
                          </p>
                        )}

                        {pharma.city && (
                          <Badge variant="outline" className="text-xs">{pharma.city}, {pharma.island}</Badge>
                        )}

                        {pharma.phone && (
                          <a href={`tel:${pharma.phone}`} className="text-sm flex items-center gap-1 text-primary hover:underline">
                            <Phone className="h-3 w-3" /> {pharma.phone}
                          </a>
                        )}

                        {pharma.is_on_duty && dutyStart && dutyEnd && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {dutyStart.toLocaleDateString('fr-FR')} — {dutyEnd.toLocaleDateString('fr-FR')}
                          </p>
                        )}

                        {pharma.notes && (
                          <p className="text-xs text-muted-foreground italic">{pharma.notes}</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
