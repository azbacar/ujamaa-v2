import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, MapPin, DollarSign, FileText, Search, Building } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdSpace from '@/components/AdSpace';
import TenderSubmissionForm from '@/components/TenderSubmissionForm';
import { useLanguage } from '@/components/LanguageProvider';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { usePageSEO } from '@/hooks/usePageSEO';

interface Tender {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  created_at: string;
}

const TendersPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAnnonceur } = useRole();
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIsland, setSelectedIsland] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        const { data, error } = await supabase
          .from('content_items')
          .select('id, title, description, category, created_at')
          .eq('type', 'tender')
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTenders(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des appels d\'offres:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenders();
  }, []);

  const filteredTenders = tenders.filter(tender => {
    const matchesSearch = tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (tender.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesCategory = selectedCategory === 'all' || tender.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'closing_soon': return 'bg-orange-100 text-orange-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Santé': return '🏥';
      case 'Infrastructure': return '🏗️';
      case 'Agriculture': return '🌾';
      case 'Éducation': return '🎓';
      case 'Environnement': return '🌳';
      default: return '📋';
    }
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <Header currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
      
      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold gradient-text mb-4">📋 Appels d'Offres</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez toutes les opportunités d'affaires et marchés publics aux Comores
          </p>
        </div>

        {/* Filtres */}
        <Card className="glass-effect mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher un appel d'offres..."
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
                  <SelectItem value="Santé">Santé</SelectItem>
                  <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="Agriculture">Agriculture</SelectItem>
                  <SelectItem value="Éducation">Éducation</SelectItem>
                  <SelectItem value="Environnement">Environnement</SelectItem>
                </SelectContent>
              </Select>

              <Button className="bg-gradient-to-r from-emerald-500 to-ocean-500">
                Filtrer ({filteredTenders.length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Espace publicitaire - banner */}
        <div className="flex justify-center mb-8">
          <AdSpace size="banner" position="header" />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement des appels d'offres...</p>
          </div>
        ) : (
        <div className="space-y-6">
          {filteredTenders.map((tender) => (
            <Card key={tender.id} className="card-hover">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryIcon(tender.category || '')}</span>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{tender.title}</CardTitle>
                      {tender.category && (
                        <Badge variant="outline" className="mt-2">
                          {tender.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(tender.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-gray-700">{tender.description || 'Aucune description disponible'}</p>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/appels-offres/${tender.id}`)}>
                      <FileText className="w-4 h-4 mr-2" />
                      Voir les détails
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-emerald-500 to-ocean-500"
                      onClick={() => {
                        setSelectedTender(tender);
                        setIsSubmissionOpen(true);
                      }}
                    >
                      Soumettre une offre
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}

        {!loading && filteredTenders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucun appel d'offres trouvé avec ces critères.</p>
          </div>
        )}

        {/* Section d'action */}
        <div className="mt-12 max-w-lg mx-auto">
          {showUpgrade && (!user || !isAnnonceur()) ? (
            <UpgradePrompt action="publier un appel d'offres" />
          ) : (
            <div className="text-center space-y-6">
              <div className="bg-gradient-to-r from-orange-100 to-red-100 p-8 rounded-3xl">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  📋 Vous lancez un appel d'offres ?
                </h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Publiez vos appels d'offres sur UJAMAA pour recevoir les meilleures propositions des prestataires locaux.
                </p>
                <Button 
                  size="lg" 
                  onClick={() => {
                    if (!user) { navigate('/auth'); return; }
                    if (!isAnnonceur()) { setShowUpgrade(true); return; }
                    navigate('/annonceur');
                  }}
                  className="bg-gradient-to-r from-orange-500 via-red-600 to-pink-500 text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:shadow-orange-500/50 transition-all hover:scale-105"
                >
                  ✨ Publier un appel d'offres
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
      
      <Dialog open={isSubmissionOpen} onOpenChange={setIsSubmissionOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          {selectedTender && (
            <TenderSubmissionForm
              tenderId={selectedTender.id}
              tenderTitle={selectedTender.title}
              onClose={() => {
                setIsSubmissionOpen(false);
                setSelectedTender(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default TendersPage;