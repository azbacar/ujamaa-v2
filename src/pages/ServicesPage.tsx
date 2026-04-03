import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, MapPin, Phone, Mail, Search, Building2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdSpace from '@/components/AdSpace';
import { useLanguage } from '@/components/LanguageProvider';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { usePageSEO } from '@/hooks/usePageSEO';

interface Service {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  created_at: string;
}

const ServicesPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAnnonceur } = useRole();
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIsland, setSelectedIsland] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('content_items')
          .select('id, title, description, category, created_at')
          .eq('type', 'service')
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setServices(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (service.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'limited': return 'bg-orange-100 text-orange-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Administration': return '🏛️';
      case 'Santé': return '🏥';
      case 'Communication': return '📮';
      case 'Éducation': return '🎓';
      case 'Commerce': return '🏪';
      case 'Justice': return '⚖️';
      default: return '🏢';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50">
      <Header currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
      
      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold gradient-text mb-4">🏛️ Services Publics</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Trouvez tous les services publics et administratifs des Comores
          </p>
        </div>

        {/* Filtres */}
        <Card className="glass-effect mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher un service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedIsland} onValueChange={setSelectedIsland}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les îles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les îles</SelectItem>
                  <SelectItem value="Grande Comore">Grande Comore</SelectItem>
                  <SelectItem value="Anjouan">Anjouan</SelectItem>
                  <SelectItem value="Mohéli">Mohéli</SelectItem>
                  <SelectItem value="Mayotte">Mayotte</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  <SelectItem value="Administration">Administration</SelectItem>
                  <SelectItem value="Santé">Santé</SelectItem>
                  <SelectItem value="Communication">Communication</SelectItem>
                  <SelectItem value="Éducation">Éducation</SelectItem>
                  <SelectItem value="Commerce">Commerce</SelectItem>
                  <SelectItem value="Justice">Justice</SelectItem>
                </SelectContent>
              </Select>

              <Button className="bg-gradient-to-r from-emerald-500 to-ocean-500">
                Filtrer ({filteredServices.length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Espace publicitaire - banner */}
        <div className="mb-8">
          <AdSpace size="banner" position="header" className="mx-auto" />
        </div>

        {/* Liste des services */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement des services...</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredServices.map((service) => (
            <Card key={service.id} className="card-hover">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryIcon(service.category || '')}</span>
                    <div>
                      <CardTitle className="text-lg">{service.title}</CardTitle>
                      {service.category && (
                        <Badge variant="outline" className="mt-1">
                          {service.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(service.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-gray-700">{service.description || 'Aucune description disponible'}</p>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-ocean-500" onClick={() => navigate(`/services/${service.id}`)}>
                    Voir les détails
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}

        {!loading && filteredServices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucun service trouvé avec ces critères.</p>
          </div>
        )}

        {/* Section d'action */}
        <div className="mt-12 max-w-lg mx-auto">
          {showUpgrade && (!user || !isAnnonceur()) ? (
            <UpgradePrompt action="proposer un service" />
          ) : (
            <div className="text-center space-y-6">
              <div className="bg-gradient-to-r from-teal-100 to-cyan-100 p-8 rounded-3xl">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  🛠️ Vous proposez un service ?
                </h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Faites connaître vos services sur UJAMAA et développez votre activité dans toutes les îles.
                </p>
                <Button 
                  size="lg" 
                  onClick={() => {
                    if (!user) { navigate('/auth'); return; }
                    if (!isAnnonceur()) { setShowUpgrade(true); return; }
                    navigate('/annonceur');
                  }}
                  className="bg-gradient-to-r from-teal-500 via-cyan-600 to-blue-500 text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:shadow-teal-500/50 transition-all hover:scale-105"
                >
                  ✨ Ajouter mon service
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer ad */}
        <div className="mt-8 flex justify-center">
          <AdSpace size="banner" position="footer" lazy />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ServicesPage;