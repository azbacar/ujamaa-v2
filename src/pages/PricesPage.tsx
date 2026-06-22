import { useState, useMemo, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Search, Filter, TrendingUp, TrendingDown, MapPin, User, Calendar, Crown,
  ExternalLink, ChevronDown, LayoutGrid, List, Sparkles, Flame, X, Plus, ArrowUpDown,
} from 'lucide-react';
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
const AD_EVERY = 6;

type SortKey = 'recent' | 'price_asc' | 'price_desc' | 'trend_up';
type ViewMode = 'grid' | 'list';

interface PriceData {
  id: string;
  product: string;
  category: string;
  price: number;
  currency: string;
  vendor: string;
  location: { village: string | null; city: string; region: string | null; island: string };
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
  usePageSEO({
    title: 'Prix du Marché',
    description: 'Comparez les prix des produits alimentaires, matériaux et services aux Comores en temps réel.',
    canonicalPath: '/prix',
    keywords: 'prix Comores, marché, produits, alimentation, Moroni',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [selectedIsland, setSelectedIsland] = useState('Toutes');
  const [selectedVendor, setSelectedVendor] = useState('Tous');
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<PriceData | null>(null);
  const [pricesData, setPricesData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [searchTerm, selectedCategory, selectedIsland, selectedVendor, sortKey]);

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
          .from('prices').select('*').eq('status', 'published').order('created_at', { ascending: false });
        if (error) throw error;

        const mappedData: PriceData[] = (data || []).map(item => ({
          id: item.id, product: item.product, category: item.category,
          price: Number(item.price), currency: item.currency, vendor: item.vendor, market: item.market,
          location: { village: item.village, city: item.city, region: item.region, island: item.island },
          trend: item.trend as 'up' | 'down' | 'stable',
          unit: item.unit, created_at: item.created_at,
          image_url: (item as any).image_url, latitude: (item as any).latitude,
          longitude: (item as any).longitude, merchant_type: (item as any).merchant_type,
          geo_expires_at: (item as any).geo_expires_at,
        }));

        setPricesData(mappedData);
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

  const categoryCounts = useMemo(() => {
    const m = new Map<string, number>();
    pricesData.forEach(p => m.set(p.category, (m.get(p.category) || 0) + 1));
    return m;
  }, [pricesData]);

  const categories = useMemo(() =>
    ['Toutes', ...Array.from(categoryCounts.keys()).sort()],
    [categoryCounts]
  );

  const islands = useMemo(() =>
    ['Toutes', ...Array.from(new Set(pricesData.map(p => p.location.island))).sort()],
    [pricesData]
  );

  const vendors = useMemo(() =>
    ['Tous', ...Array.from(new Set(pricesData.map(p => p.vendor))).sort()],
    [pricesData]
  );

  const filteredPrices = useMemo(() => {
    const q = searchTerm.toLowerCase();
    const filtered = pricesData.filter(price => {
      const matchesSearch = !q ||
        price.product.toLowerCase().includes(q) ||
        price.vendor.toLowerCase().includes(q) ||
        (price.location.village?.toLowerCase().includes(q) || false) ||
        price.market.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'Toutes' || price.category === selectedCategory;
      const matchesIsland = selectedIsland === 'Toutes' || price.location.island === selectedIsland;
      const matchesVendor = selectedVendor === 'Tous' || price.vendor === selectedVendor;
      return matchesSearch && matchesCategory && matchesIsland && matchesVendor;
    });

    switch (sortKey) {
      case 'price_asc': return [...filtered].sort((a, b) => a.price - b.price);
      case 'price_desc': return [...filtered].sort((a, b) => b.price - a.price);
      case 'trend_up': return [...filtered].sort((a, b) => Number(b.trend === 'up') - Number(a.trend === 'up'));
      default: return filtered;
    }
  }, [searchTerm, selectedCategory, selectedIsland, selectedVendor, pricesData, sortKey]);

  const stats = useMemo(() => {
    const total = pricesData.length;
    const islandsCount = new Set(pricesData.map(p => p.location.island)).size;
    const vendorsCount = new Set(pricesData.map(p => p.vendor)).size;
    const fresh = pricesData.filter(p => Date.now() - new Date(p.created_at).getTime() < 24 * 3600 * 1000).length;
    return { total, islandsCount, vendorsCount, fresh };
  }, [pricesData]);

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-rose-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-emerald-500" />;
    return <div className="w-2 h-2 rounded-full bg-sky-500" />;
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'up') return 'text-rose-700 bg-rose-50 border-rose-200';
    if (trend === 'down') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    return 'text-sky-700 bg-sky-50 border-sky-200';
  };

  const isFresh = (created: string) => Date.now() - new Date(created).getTime() < 24 * 3600 * 1000;

  const clearFilters = () => {
    setSearchTerm(''); setSelectedCategory('Toutes'); setSelectedIsland('Toutes'); setSelectedVendor('Tous');
  };

  const activeFilters = [
    searchTerm && { label: `"${searchTerm}"`, clear: () => setSearchTerm('') },
    selectedCategory !== 'Toutes' && { label: selectedCategory, clear: () => setSelectedCategory('Toutes') },
    selectedIsland !== 'Toutes' && { label: selectedIsland, clear: () => setSelectedIsland('Toutes') },
    selectedVendor !== 'Tous' && { label: selectedVendor, clear: () => setSelectedVendor('Tous') },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const visible = filteredPrices.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/60 via-teal-50/40 to-sky-50/60">
      <Header currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* HERO compact + stats live */}
        <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/40 to-sky-50/40 p-5 sm:p-8 mb-6 shadow-sm">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-sky-200/30 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Données en temps réel
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight">
                Prix & Marchés{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
                  des Comores
                </span>
              </h1>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground">
                Comparez les prix dans toutes les îles. Filtrez, triez, partagez — et publiez vos propres prix.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {[
                { label: 'Prix actifs', value: stats.total, color: 'text-emerald-700' },
                { label: 'Îles', value: stats.islandsCount, color: 'text-sky-700' },
                { label: 'Vendeurs', value: stats.vendorsCount, color: 'text-teal-700' },
                { label: 'Nouveaux 24h', value: stats.fresh, color: 'text-amber-700' },
              ].map(s => (
                <div key={s.label} className="rounded-xl bg-card/80 backdrop-blur border border-border px-2.5 py-2 text-center min-w-[68px]">
                  <div className={`text-lg sm:text-xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wide leading-tight">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AD banner */}
        <div className="flex justify-center mb-6">
          <AdSpace size="banner" position="header" />
        </div>

        {/* STICKY filter bar */}
        <div className="sticky top-[64px] z-30 -mx-4 sm:mx-0 mb-5">
          <div className="mx-4 sm:mx-0 rounded-2xl border border-border bg-card/95 backdrop-blur-lg shadow-md p-3 sm:p-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-2 md:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher un produit, vendeur, marché ou village..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 border-0 bg-muted/40 focus-visible:ring-1 focus-visible:ring-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 md:flex md:flex-row gap-2">
                <Select value={selectedIsland} onValueChange={setSelectedIsland}>
                  <SelectTrigger className="h-11 md:w-36 border-0 bg-muted/40"><SelectValue placeholder="Île" /></SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {islands.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                  <SelectTrigger className="h-11 md:w-40 border-0 bg-muted/40"><SelectValue placeholder="Vendeur" /></SelectTrigger>
                  <SelectContent className="bg-popover z-50 max-h-72">
                    {vendors.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                  <SelectTrigger className="h-11 md:w-44 border-0 bg-muted/40">
                    <ArrowUpDown className="w-4 h-4 mr-1 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="recent">Plus récents</SelectItem>
                    <SelectItem value="price_asc">Prix croissant</SelectItem>
                    <SelectItem value="price_desc">Prix décroissant</SelectItem>
                    <SelectItem value="trend_up">En hausse d'abord</SelectItem>
                  </SelectContent>
                </Select>
                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={(v) => v && setViewMode(v as ViewMode)}
                  className="h-11 hidden md:flex bg-muted/40 rounded-md px-1"
                >
                  <ToggleGroupItem value="grid" aria-label="Grille" className="h-9 w-9 p-0">
                    <LayoutGrid className="w-4 h-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="list" aria-label="Liste" className="h-9 w-9 p-0">
                    <List className="w-4 h-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            {/* Category chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
              {categories.map(cat => {
                const count = cat === 'Toutes' ? pricesData.length : categoryCounts.get(cat) || 0;
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover-scale ${
                      active
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30'
                        : 'bg-muted/60 text-foreground hover:bg-muted'
                    }`}
                  >
                    {cat}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/25' : 'bg-background/80 text-muted-foreground'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active filter chips + count */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {activeFilters.length > 0 ? activeFilters.map((f, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 pl-2 pr-1 py-0.5">
                    {f.label}
                    <button onClick={f.clear} className="hover:bg-background/60 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )) : (
                  <span className="text-xs text-muted-foreground">Aucun filtre actif</span>
                )}
                {activeFilters.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs px-2">Tout effacer</Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-emerald-700">{filteredPrices.length}</span> résultat{filteredPrices.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-3'}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`animate-pulse rounded-2xl bg-muted/50 ${viewMode === 'grid' ? 'h-80' : 'h-28'}`} />
            ))}
          </div>
        ) : filteredPrices.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-card/50">
            <div className="text-5xl mb-3">🔍</div>
            <h3 className="text-xl font-bold text-foreground mb-1">Aucun prix trouvé</h3>
            <p className="text-sm text-muted-foreground mb-4">Essayez d'autres critères ou ajoutez le premier prix.</p>
            <Button onClick={clearFilters} variant="outline" size="sm">Réinitialiser les filtres</Button>
          </div>
        ) : (
          <>
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5'
              : 'space-y-3'
            }>
              {visible.map((price, idx) => (
                <Fragment key={price.id}>
                  {viewMode === 'grid' ? (
                    <Card
                      onClick={() => setSelectedPrice(price)}
                      className="group cursor-pointer overflow-hidden border-border hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 animate-fade-in bg-card"
                      style={{ animationDelay: `${(idx % PAGE_SIZE) * 30}ms` }}
                    >
                      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-emerald-100 to-sky-100">
                        {price.image_url ? (
                          <img
                            src={price.image_url}
                            alt={price.product}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-5xl opacity-50">🛒</div>
                        )}
                        <div className="absolute top-2 left-2 flex gap-1.5">
                          {isFresh(price.created_at) && (
                            <Badge className="bg-amber-500 text-white border-0 gap-1 shadow-md">
                              <Flame className="w-3 h-3" /> Nouveau
                            </Badge>
                          )}
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge variant="outline" className={`${getTrendColor(price.trend)} backdrop-blur bg-white/80 gap-1`}>
                            {getTrendIcon(price.trend)}
                            {price.trend === 'up' ? 'Hausse' : price.trend === 'down' ? 'Baisse' : 'Stable'}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-4 space-y-3">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-base text-foreground group-hover:text-emerald-700 transition-colors line-clamp-1">
                              {price.product}
                            </h3>
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] shrink-0">
                              {price.category}
                            </Badge>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-50 to-sky-50 px-3 py-2.5 rounded-xl border border-emerald-100">
                          <div className="flex items-baseline justify-between">
                            <p className="text-2xl font-black text-emerald-700 tabular-nums">
                              {price.price.toLocaleString()}
                              <span className="text-sm font-semibold ml-1 text-emerald-600">{price.currency}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">/ {price.unit}</p>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5 truncate">
                            <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{price.vendor}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{[price.location.village, price.location.city, price.location.island].filter(Boolean).join(' · ')}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{new Date(price.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>

                        <Button
                          asChild variant="ghost" size="sm"
                          className="w-full h-8 text-emerald-700 hover:bg-emerald-50 -mb-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link to={`/prix/${price.id}`}>
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Fiche complète
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    /* LIST view */
                    <Card
                      onClick={() => setSelectedPrice(price)}
                      className="group cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all animate-fade-in"
                      style={{ animationDelay: `${(idx % PAGE_SIZE) * 25}ms` }}
                    >
                      <CardContent className="p-3 flex items-center gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-emerald-100 to-sky-100 flex items-center justify-center">
                          {price.image_url ? (
                            <img src={price.image_url} alt={price.product} loading="lazy" className="w-full h-full object-cover" />
                          ) : <span className="text-2xl opacity-60">🛒</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-sm sm:text-base text-foreground truncate group-hover:text-emerald-700">{price.product}</h3>
                            {isFresh(price.created_at) && <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {price.vendor} · {price.location.city}, {price.location.island}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] h-5">{price.category}</Badge>
                            <Badge variant="outline" className={`${getTrendColor(price.trend)} text-[10px] h-5 gap-1`}>
                              {getTrendIcon(price.trend)}
                              {price.trend}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg sm:text-xl font-black text-emerald-700 tabular-nums">
                            {price.price.toLocaleString()} <span className="text-xs font-semibold">{price.currency}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground">/ {price.unit}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Interleaved ad slots — ready for many ads */}
                  {(idx + 1) % AD_EVERY === 0 && idx !== visible.length - 1 && (
                    <div className={viewMode === 'grid' ? 'sm:col-span-2 lg:col-span-3 flex justify-center my-2' : 'flex justify-center my-2'}>
                      <AdSpace size="banner" position="content" lazy />
                    </div>
                  )}
                </Fragment>
              ))}
            </div>

            {visibleCount < filteredPrices.length && (
              <div className="flex justify-center mt-8">
                <Button
                  size="lg" variant="outline"
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

        {/* Pro: Price alerts */}
        {user && (
          <div className="mt-10">
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
                      { label: 'Prix min', value: `${filteredPrices.length ? Math.min(...filteredPrices.map(p => p.price)).toLocaleString() : 0} FC` },
                      { label: 'Prix max', value: `${filteredPrices.length ? Math.max(...filteredPrices.map(p => p.price)).toLocaleString() : 0} FC` },
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

        {/* CTA */}
        <section className="mt-12 relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 p-8 sm:p-10 text-white shadow-xl">
          <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-2">💡 Vous vendez des produits ?</h3>
              <p className="text-white/90 max-w-xl text-sm sm:text-base">
                Publiez vos prix gratuitement, gagnez en visibilité dans toutes les îles et attirez plus de clients.
              </p>
            </div>
            <Button
              size="lg" onClick={() => setShowPriceForm(true)}
              className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold shadow-lg gap-2 shrink-0"
            >
              <Plus className="w-5 h-5" /> Ajouter mes prix
            </Button>
          </div>
        </section>

        {/* Footer ad */}
        <div className="mt-8 flex justify-center">
          <AdSpace size="banner" position="footer" lazy />
        </div>
      </main>

      {/* Floating Add button (mobile-friendly) */}
      <button
        onClick={() => setShowPriceForm(true)}
        className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-xl shadow-emerald-500/40 flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Ajouter un prix"
      >
        <Plus className="w-6 h-6" />
      </button>

      {showPriceForm && <PriceSubmissionForm onClose={() => setShowPriceForm(false)} />}
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
