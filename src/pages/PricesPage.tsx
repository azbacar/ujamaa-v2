import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, TrendingUp, TrendingDown, MapPin, User, Calendar, Crown, ExternalLink, ChevronDown } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdSpace from '@/components/AdSpace';
import PriceSubmissionForm from '@/components/PriceSubmissionForm';
import PriceDetailDialog from '@/components/PriceDetailDialog';
import PriceAlertsPanel from '@/components/PriceAlertsPanel';
import ProFeaturesGate from '@/components/ProFeaturesGate';
import { useLanguage } from '@/components/LanguageProvider';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePageSEO } from '@/hooks/usePageSEO';

const PAGE_SIZE = 12;

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

const PricesPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  usePageSEO({ title: 'Prix du Marché', description: 'Comparez les prix des produits alimentaires, matériaux et services aux Comores en temps réel.', canonicalPath: '/prix', keywords: 'prix Comores, marché, produits, alimentation, Moroni' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [selectedIsland, setSelectedIsland] = useState('Toutes');
  const [selectedVendor, setSelectedVendor] = useState('Tous');
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<PriceData | null>(null);
  const [pricesData, setPricesData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Reset pagination when filters change
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [searchTerm, selectedCategory, selectedIsland, selectedVendor]);

  useEffect(() => {
    if (user) {
      supabase.from('users').select('account_type').eq('id', user.id).single().then(({ data }) => {
        setIsPro(data?.account_type === 'pro' || data?.account_type === 'enterprise');
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const { data, error } = await supabase
          .from('prices')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const mappedData: PriceData[] = (data || []).map(item => ({
          id: item.id,
          product: item.product,
          category: item.category,
          price: Number(item.price),
          currency: item.currency,
          vendor: item.vendor,
          market: item.market,
          location: {
            village: item.village,
            city: item.city,
            region: item.region,
            island: item.island
          },
          trend: item.trend as 'up' | 'down' | 'stable',
          unit: item.unit,
          created_at: item.created_at,
          image_url: (item as any).image_url,
          latitude: (item as any).latitude,
          longitude: (item as any).longitude,
          merchant_type: (item as any).merchant_type,
          geo_expires_at: (item as any).geo_expires_at,
        }));

        setPricesData(mappedData);
        // Validation cohérence dataset (checksum + version)
        try {
          const { trackDatasetCoherence } = await import('@/lib/datasetChecksum');
          trackDatasetCoherence('prices', (data || []).map((d: any) => ({
            id: d.id, updated_at: d.updated_at, created_at: d.created_at,
          })));
        } catch {}
      } catch (error) {
        console.error('Erreur lors du chargement des prix:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, []);

  const categories = useMemo(() => 
    ["Toutes", ...Array.from(new Set(pricesData.map(p => p.category)))],
    [pricesData]
  );
  
  const islands = useMemo(() => 
    ["Toutes", ...Array.from(new Set(pricesData.map(p => p.location.island)))],
    [pricesData]
  );
  
  const vendors = useMemo(() => 
    ["Tous", ...Array.from(new Set(pricesData.map(p => p.vendor)))],
    [pricesData]
  );

  const filteredPrices = useMemo(() => {
    return pricesData.filter(price => {
      const matchesSearch = price.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           price.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (price.location.village?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                           price.market.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Toutes' || price.category === selectedCategory;
      const matchesIsland = selectedIsland === 'Toutes' || price.location.island === selectedIsland;
      const matchesVendor = selectedVendor === 'Tous' || price.vendor === selectedVendor;

      return matchesSearch && matchesCategory && matchesIsland && matchesVendor;
    });
  }, [searchTerm, selectedCategory, selectedIsland, selectedVendor, pricesData]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-blue-500"></div>;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'down':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('Toutes');
    setSelectedIsland('Toutes');
    setSelectedVendor('Tous');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50">
      <Header currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
      
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* En-tête */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black gradient-text mb-4 sm:mb-6">
            💰 Prix & Marchés des Comores
          </h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Consultez en temps réel les prix des produits dans tous les marchés des Comores. 
            <span className="text-emerald-600 font-semibold"> Filtrez par île, ville, vendeur ou catégorie</span> pour trouver les meilleures offres.
          </p>
        </div>

        {/* Espace publicitaire */}
        <div className="flex justify-center mb-8">
          <AdSpace size="banner" position="header" />
        </div>

        {/* Système de filtrage */}
        <Card className="mb-8 glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Filter className="w-6 h-6 text-emerald-600" />
              Filtres de recherche
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Rechercher un produit, vendeur ou lieu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-lg border-emerald-200 focus:border-emerald-400"
              />
            </div>

            {/* Filtres dropdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-12 border-emerald-200">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-emerald-200 shadow-lg z-50">
                  {categories.map(category => (
                    <SelectItem key={category} value={category} className="hover:bg-emerald-50">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedIsland} onValueChange={setSelectedIsland}>
                <SelectTrigger className="h-12 border-emerald-200">
                  <SelectValue placeholder="Île" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-emerald-200 shadow-lg z-50">
                  {islands.map(island => (
                    <SelectItem key={island} value={island} className="hover:bg-emerald-50">
                      {island}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger className="h-12 border-emerald-200">
                  <SelectValue placeholder="Vendeur" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-emerald-200 shadow-lg z-50">
                  {vendors.map(vendor => (
                    <SelectItem key={vendor} value={vendor} className="hover:bg-emerald-50">
                      {vendor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-gray-600">
                <span className="font-semibold text-emerald-600">{filteredPrices.length}</span> prix trouvés
              </p>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                Effacer les filtres
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement des prix...</p>
          </div>
        ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrices.slice(0, visibleCount).map(price => (
            <Card key={price.id} className="feature-card card-hover group cursor-pointer overflow-hidden" onClick={() => setSelectedPrice(price)}>
              {price.image_url && (
                <div className="h-36 overflow-hidden">
                  <img src={price.image_url} alt={price.product} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              )}
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-emerald-700 transition-colors">
                      {price.product}
                    </h3>
                    <Badge variant="secondary" className="mt-2 bg-emerald-100 text-emerald-800 border-emerald-200">
                      {price.category}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      {getTrendIcon(price.trend)}
                      <Badge variant="outline" className={getTrendColor(price.trend)}>
                        {price.trend === 'up' ? '↗️ Hausse' : price.trend === 'down' ? '↘️ Baisse' : '➡️ Stable'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-ocean-50 p-4 rounded-xl mb-4">
                  <div className="text-center">
                    <p className="text-3xl font-black text-emerald-700">
                      {price.price.toLocaleString()} {price.currency}
                    </p>
                    <p className="text-gray-600">par {price.unit}</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600" />
                    <span>{price.vendor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>{[price.location.village, price.location.city].filter(Boolean).join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>Mis à jour le {new Date(price.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">
                    <strong>Marché :</strong> {price.market}
                  </p>
                  <p className="text-xs text-gray-500">
                    <strong>Région :</strong> {[price.location.region, price.location.island].filter(Boolean).join(', ')}
                  </p>
                </div>

                {/* Lien unique partageable */}
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link to={`/prix/${price.id}`}>
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Voir la fiche complète
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bouton "Voir plus" */}
        {visibleCount < filteredPrices.length && (
          <div className="flex justify-center mt-8">
            <Button
              size="lg"
              variant="outline"
              onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-2"
            >
              <ChevronDown className="h-5 w-5" />
              Voir plus ({filteredPrices.length - visibleCount} restants)
            </Button>
          </div>
        )}
        </>
        )}

        {!loading && filteredPrices.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-600 mb-2">Aucun prix trouvé</h3>
            <p className="text-gray-500">Essayez de modifier vos critères de recherche.</p>
          </div>
        )}

        {/* Pro: Price alerts */}
        {user && (
          <div className="mt-8">
            <ProFeaturesGate feature="Les alertes prix en temps réel" isPro={isPro}>
              <PriceAlertsPanel />
            </ProFeaturesGate>
          </div>
        )}

        {/* Pro: Advanced stats */}
        {user && (
          <div className="mt-6">
            <ProFeaturesGate feature="Les statistiques avancées des prix" isPro={isPro}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Crown className="h-5 w-5 text-amber-500" /> Statistiques avancées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Prix moyen', value: `${Math.round(filteredPrices.reduce((a, b) => a + b.price, 0) / (filteredPrices.length || 1)).toLocaleString()} FC` },
                      { label: 'Prix min', value: `${Math.min(...filteredPrices.map(p => p.price)).toLocaleString()} FC` },
                      { label: 'Prix max', value: `${Math.max(...filteredPrices.map(p => p.price)).toLocaleString()} FC` },
                      { label: 'En hausse', value: `${filteredPrices.filter(p => p.trend === 'up').length} produits` },
                    ].map(stat => (
                      <div key={stat.label} className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-lg font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </ProFeaturesGate>
          </div>
        )}

        {/* Section d'action */}
        <div className="text-center mt-12 space-y-6">
          <div className="bg-gradient-to-r from-emerald-100 to-ocean-100 p-8 rounded-3xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              💡 Vous vendez des produits ?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Ajoutez vos prix sur UJAMAA pour augmenter votre visibilité et attirer plus de clients dans toutes les îles.
            </p>
            <Button 
              size="lg" 
              onClick={() => setShowPriceForm(true)}
              className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-ocean-500 text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:shadow-magenta-500/50 transition-all hover:scale-105"
            >
              ✨ Ajouter mes prix
            </Button>
          </div>
        </div>

        {/* Footer ad */}
        <div className="mt-8 flex justify-center">
          <AdSpace size="banner" position="footer" lazy />
        </div>
      </main>

      {showPriceForm && (
        <PriceSubmissionForm onClose={() => setShowPriceForm(false)} />
      )}

      <PriceDetailDialog
        price={selectedPrice}
        open={!!selectedPrice}
        onOpenChange={(open) => { if (!open) setSelectedPrice(null); }}
      />

      <Footer />
    </div>
  );
};

export default PricesPage;