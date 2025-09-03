import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, TrendingUp, TrendingDown, MapPin, User, Calendar } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdSpace from '@/components/AdSpace';
import PriceSubmissionForm from '@/components/PriceSubmissionForm';
import { useLanguage } from '@/components/LanguageProvider';

interface PriceData {
  id: number;
  product: string;
  category: string;
  price: number;
  currency: string;
  vendor: string;
  location: {
    village: string;
    city: string;
    region: string;
    island: string;
  };
  market: string;
  lastUpdated: string;
  trend: 'up' | 'down' | 'stable';
  unit: string;
}

const pricesData: PriceData[] = [
  {
    id: 1,
    product: "Riz blanc importé",
    category: "Céréales",
    price: 1500,
    currency: "FC",
    vendor: "Mama Hadija",
    location: { village: "Volo-Volo", city: "Moroni", region: "Ngazidja", island: "Grande Comore" },
    market: "Marché Central Volo-Volo",
    lastUpdated: "2024-01-15",
    trend: "down",
    unit: "kg"
  },
  {
    id: 2,
    product: "Bananes locales",
    category: "Fruits",
    price: 500,
    currency: "FC",
    vendor: "Ahmed Soilihi",
    location: { village: "Bangoi-Madjou", city: "Mutsamudu", region: "Ndzuwani", island: "Anjouan" },
    market: "Marché de Mutsamudu",
    lastUpdated: "2024-01-15",
    trend: "stable",
    unit: "régime"
  },
  {
    id: 3,
    product: "Poisson thon",
    category: "Poissons",
    price: 2000,
    currency: "FC",
    vendor: "Coopérative des Pêcheurs",
    location: { village: "Hoani", city: "Fomboni", region: "Mwali", island: "Mohéli" },
    market: "Port de pêche Hoani",
    lastUpdated: "2024-01-14",
    trend: "up",
    unit: "kg"
  },
  {
    id: 4,
    product: "Tomates",
    category: "Légumes",
    price: 800,
    currency: "FC",
    vendor: "Fatima Abdou",
    location: { village: "Mramani", city: "Moroni", region: "Ngazidja", island: "Grande Comore" },
    market: "Marché Mramani",
    lastUpdated: "2024-01-15",
    trend: "up",
    unit: "kg"
  },
  {
    id: 5,
    product: "Huile de palme",
    category: "Huiles",
    price: 3500,
    currency: "FC",
    vendor: "Moussa Ali",
    location: { village: "Sima", city: "Mutsamudu", region: "Ndzuwani", island: "Anjouan" },
    market: "Marché de Sima",
    lastUpdated: "2024-01-13",
    trend: "stable",
    unit: "litre"
  },
  {
    id: 6,
    product: "Ylang-ylang",
    category: "Produits agricoles",
    price: 15000,
    currency: "FC",
    vendor: "Coopérative Agricole",
    location: { village: "Bambao", city: "Bambao", region: "Ngazidja", island: "Grande Comore" },
    market: "Centre de collecte Bambao",
    lastUpdated: "2024-01-12",
    trend: "up",
    unit: "kg"
  },
  {
    id: 7,
    product: "Vanille",
    category: "Épices",
    price: 25000,
    currency: "FC",
    vendor: "Said Mohamed",
    location: { village: "Mirontsy", city: "Fomboni", region: "Mwali", island: "Mohéli" },
    market: "Coopérative de Mirontsy",
    lastUpdated: "2024-01-14",
    trend: "up",
    unit: "kg"
  },
  {
    id: 8,
    product: "Lait en poudre",
    category: "Produits laitiers",
    price: 4500,
    currency: "FC",
    vendor: "Magasin Al-Nour",
    location: { village: "Domoni", city: "Domoni", region: "Ndzuwani", island: "Anjouan" },
    market: "Magasin Al-Nour",
    lastUpdated: "2024-01-15",
    trend: "stable",
    unit: "boîte 400g"
  },
  {
    id: 9,
    product: "Manioc frais",
    category: "Tubercules",
    price: 300,
    currency: "FC",
    vendor: "Coopérative de Tsembehou",
    location: { village: "Tsembehou", city: "Moroni", region: "Ngazidja", island: "Grande Comore" },
    market: "Marché de Tsembehou",
    lastUpdated: "2024-01-16",
    trend: "stable",
    unit: "kg"
  },
  {
    id: 10,
    product: "Mangues",
    category: "Fruits",
    price: 600,
    currency: "FC",
    vendor: "Ali Mzé",
    location: { village: "Patsy", city: "Mutsamudu", region: "Ndzuwani", island: "Anjouan" },
    market: "Marché de Patsy",
    lastUpdated: "2024-01-16",
    trend: "down",
    unit: "kg"
  },
  {
    id: 11,
    product: "Ciment",
    category: "Matériaux",
    price: 7500,
    currency: "FC",
    vendor: "Quincaillerie Moderne",
    location: { village: "Coulée", city: "Moroni", region: "Ngazidja", island: "Grande Comore" },
    market: "Zone Industrielle Coulée",
    lastUpdated: "2024-01-15",
    trend: "up",
    unit: "sac 50kg"
  },
  {
    id: 12,
    product: "Poisson rouge",
    category: "Poissons",
    price: 1800,
    currency: "FC",
    vendor: "Pêcheurs de Nioumachoua",
    location: { village: "Nioumachoua", city: "Fomboni", region: "Mwali", island: "Mohéli" },
    market: "Port de Nioumachoua",
    lastUpdated: "2024-01-16",
    trend: "stable",
    unit: "kg"
  },
  {
    id: 13,
    product: "Clous de girofle",
    category: "Épices",
    price: 12000,
    currency: "FC",
    vendor: "Exportateur Anjouan",
    location: { village: "Ouani", city: "Ouani", region: "Ndzuwani", island: "Anjouan" },
    market: "Centre d'Export Ouani",
    lastUpdated: "2024-01-14",
    trend: "up",
    unit: "kg"
  },
  {
    id: 14,
    product: "Pommes de terre",
    category: "Légumes",
    price: 1200,
    currency: "FC",
    vendor: "Importateur Hadoud",
    location: { village: "Mkazi", city: "Moroni", region: "Ngazidja", island: "Grande Comore" },
    market: "Marché de Mkazi",
    lastUpdated: "2024-01-15",
    trend: "down",
    unit: "kg"
  },
  {
    id: 15,
    product: "Piment",
    category: "Épices",
    price: 2500,
    currency: "FC",
    vendor: "Fatou Saada",
    location: { village: "Pomoni", city: "Pomoni", region: "Ndzuwani", island: "Anjouan" },
    market: "Marché de Pomoni",
    lastUpdated: "2024-01-16",
    trend: "stable",
    unit: "kg"
  },
  {
    id: 16,
    product: "Carburant essence",
    category: "Carburants",
    price: 950,
    currency: "FC",
    vendor: "Station Total",
    location: { village: "Chindini", city: "Fomboni", region: "Mwali", island: "Mohéli" },
    market: "Station-service Chindini",
    lastUpdated: "2024-01-16",
    trend: "up",
    unit: "litre"
  },
  {
    id: 17,
    product: "Bœuf local",
    category: "Viandes",
    price: 3000,
    currency: "FC",
    vendor: "Boucherie Moderne",
    location: { village: "Mitsoudjé", city: "Moroni", region: "Ngazidja", island: "Grande Comore" },
    market: "Boucherie Mitsoudjé",
    lastUpdated: "2024-01-15",
    trend: "stable",
    unit: "kg"
  },
  {
    id: 18,
    product: "Savon en poudre",
    category: "Produits ménagers",
    price: 2200,
    currency: "FC",
    vendor: "Supermarché Jumbo",
    location: { village: "Adda-Douéni", city: "Mutsamudu", region: "Ndzuwani", island: "Anjouan" },
    market: "Supermarché Jumbo",
    lastUpdated: "2024-01-16",
    trend: "stable",
    unit: "paquet 2kg"
  },
  {
    id: 19,
    product: "Noix de coco",
    category: "Fruits",
    price: 200,
    currency: "FC",
    vendor: "Récolteurs Locaux",
    location: { village: "Djoiezi", city: "Fomboni", region: "Mwali", island: "Mohéli" },
    market: "Marché de Djoiezi",
    lastUpdated: "2024-01-16",
    trend: "down",
    unit: "pièce"
  },
  {
    id: 20,
    product: "Sucre blanc",
    category: "Produits alimentaires",
    price: 1100,
    currency: "FC",
    vendor: "Épicerie Centrale",
    location: { village: "Itsandra", city: "Moroni", region: "Ngazidja", island: "Grande Comore" },
    market: "Épicerie Itsandra",
    lastUpdated: "2024-01-15",
    trend: "up",
    unit: "kg"
  }
];

const categories = ["Toutes", ...Array.from(new Set(pricesData.map(p => p.category)))];
const islands = ["Toutes", ...Array.from(new Set(pricesData.map(p => p.location.island)))];
const vendors = ["Tous", ...Array.from(new Set(pricesData.map(p => p.vendor)))];

const PricesPage = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [selectedIsland, setSelectedIsland] = useState('Toutes');
  const [selectedVendor, setSelectedVendor] = useState('Tous');
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [showPriceForm, setShowPriceForm] = useState(false);

  const filteredPrices = useMemo(() => {
    return pricesData.filter(price => {
      const matchesSearch = price.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           price.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           price.location.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           price.market.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Toutes' || price.category === selectedCategory;
      const matchesIsland = selectedIsland === 'Toutes' || price.location.island === selectedIsland;
      const matchesVendor = selectedVendor === 'Tous' || price.vendor === selectedVendor;

      return matchesSearch && matchesCategory && matchesIsland && matchesVendor;
    });
  }, [searchTerm, selectedCategory, selectedIsland, selectedVendor]);

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
      
      <main className="container mx-auto px-6 py-12">
        {/* En-tête */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-black gradient-text mb-6">
            💰 Prix & Marchés des Comores
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
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

        {/* Liste des prix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrices.map(price => (
            <Card key={price.id} className="feature-card card-hover group">
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
                    <span>{price.location.village}, {price.location.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>Mis à jour le {new Date(price.lastUpdated).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">
                    <strong>Marché :</strong> {price.market}
                  </p>
                  <p className="text-xs text-gray-500">
                    <strong>Région :</strong> {price.location.region}, {price.location.island}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPrices.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-600 mb-2">Aucun prix trouvé</h3>
            <p className="text-gray-500">Essayez de modifier vos critères de recherche.</p>
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
      </main>

      {showPriceForm && (
        <PriceSubmissionForm onClose={() => setShowPriceForm(false)} />
      )}

      <Footer />
    </div>
  );
};

export default PricesPage;