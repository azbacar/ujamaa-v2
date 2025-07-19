import { useState } from 'react';
import { Search, Filter, MapPin, Calendar, DollarSign, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/components/LanguageProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  island: string;
  date: string;
  price?: string;
  url?: string;
}

interface SearchSystemProps {
  onSearchResult?: (results: SearchResult[]) => void;
}

const SearchSystem = ({ onSearchResult }: SearchSystemProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedIsland, setSelectedIsland] = useState('all');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Données mockées pour la démonstration
  const mockData: SearchResult[] = [
    {
      id: '1',
      title: 'Prix du riz local',
      description: 'Riz blanc de qualité supérieure, production locale',
      category: 'prix',
      island: 'grande-comore',
      date: '2024-01-19',
      price: '850 KMF/kg'
    },
    {
      id: '2',
      title: 'Festival de la vanille',
      description: 'Célébration annuelle de la récolte de vanille',
      category: 'evenements',
      island: 'anjouan',
      date: '2024-02-15'
    },
    {
      id: '3',
      title: 'Consultation médicale',
      description: 'Centre de santé de Moroni - Consultations générales',
      category: 'services',
      island: 'grande-comore',
      date: '2024-01-19',
      price: '2000 KMF'
    },
    {
      id: '4',
      title: 'Demande de passeport à Mayotte',
      description: 'Procédure et documents nécessaires pour obtenir un passeport français',
      category: 'services',
      island: 'mayotte',
      date: '2024-01-19'
    },
    {
      id: '5',
      title: 'Prix du poisson frais',
      description: 'Thon rouge, pêche du jour au marché de Mamoudzou',
      category: 'prix',
      island: 'mayotte',
      date: '2024-01-19',
      price: '12 €/kg'
    },
    {
      id: '6',
      title: 'Appel d\'offre construction école',
      description: 'Construction d\'une nouvelle école primaire à Mohéli',
      category: 'appels-offres',
      island: 'moheli',
      date: '2024-01-25'
    }
  ];

  const categories = [
    { value: 'all', label: 'Toutes catégories' },
    { value: 'prix', label: 'Prix & Marchés' },
    { value: 'evenements', label: 'Événements' },
    { value: 'services', label: 'Services' },
    { value: 'appels-offres', label: 'Appels d\'offres' }
  ];

  const islands = [
    { value: 'all', label: 'Toutes les îles' },
    { value: 'grande-comore', label: 'Grande Comore' },
    { value: 'anjouan', label: 'Anjouan' },
    { value: 'moheli', label: 'Mohéli' },
    { value: 'mayotte', label: 'Mayotte' }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'prix': return <DollarSign className="w-4 h-4" />;
      case 'evenements': return <Calendar className="w-4 h-4" />;
      case 'services': return <FileText className="w-4 h-4" />;
      case 'appels-offres': return <FileText className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Recherche vide",
        description: "Veuillez saisir un terme de recherche.",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);

    try {
      // Filtrer les données mockées
      let filteredResults = mockData.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (selectedCategory !== 'all') {
        filteredResults = filteredResults.filter(item => item.category === selectedCategory);
      }

      if (selectedIsland !== 'all') {
        filteredResults = filteredResults.filter(item => item.island === selectedIsland);
      }

      // Appeler l'IA pour des résultats enrichis
      try {
        const { data } = await supabase.functions.invoke('ai-chat', {
          body: {
            message: `Recherche: ${searchQuery}. Catégorie: ${selectedCategory}. Île: ${selectedIsland}`,
            sessionId: `search_${Date.now()}`,
            searchQuery: searchQuery
          }
        });

        if (data?.response) {
          toast({
            title: "Résultats enrichis par l'IA",
            description: "L'assistant IA a analysé votre recherche.",
          });
        }
      } catch (aiError) {
        console.error('AI search enhancement failed:', aiError);
      }

      setSearchResults(filteredResults);
      onSearchResult?.(filteredResults);

      toast({
        title: "Recherche terminée",
        description: `${filteredResults.length} résultat(s) trouvé(s).`,
      });

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Erreur de recherche",
        description: "Une erreur est survenue lors de la recherche.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-600" />
            Moteur de recherche UJAMAA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 w-5 h-5" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Rechercher des informations, prix, événements..."
                className="pl-10"
                disabled={isSearching}
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-gradient-to-r from-emerald-500 to-ocean-500"
            >
              {isSearching ? 'Recherche...' : 'Rechercher'}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedIsland} onValueChange={setSelectedIsland}>
              <SelectTrigger className="sm:w-48">
                <MapPin className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {islands.map(island => (
                  <SelectItem key={island.value} value={island.value}>
                    {island.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Résultats de recherche */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-900">
            Résultats de recherche ({searchResults.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map(result => (
              <Card key={result.id} className="feature-card card-hover">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(result.category)}
                      <Badge variant="outline" className="text-xs">
                        {result.category}
                      </Badge>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {islands.find(i => i.value === result.island)?.label}
                    </Badge>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {result.title}
                    </h4>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {result.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{result.date}</span>
                    {result.price && (
                      <span className="font-semibold text-emerald-600">
                        {result.price}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSystem;