import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, DollarSign, FileText, Search, Building } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Tender {
  id: number;
  title: string;
  description: string;
  organization: string;
  budget: string;
  deadline: string;
  location: string;
  island: string;
  category: string;
  status: 'open' | 'closing_soon' | 'closed';
  requirements: string[];
}

const TendersPage = () => {
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIsland, setSelectedIsland] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const tenders: Tender[] = [
    {
      id: 1,
      title: "Construction d'un Centre de Santé",
      description: "Construction et équipement d'un centre de santé communautaire avec 20 lits et équipements médicaux modernes",
      organization: "Ministère de la Santé",
      budget: "2,500,000 KMF",
      deadline: "2024-03-15",
      location: "Mutsamudu",
      island: "Anjouan",
      category: "Santé",
      status: "open",
      requirements: ["Licence de construction", "Expérience 5+ ans", "Certification ISO"]
    },
    {
      id: 2,
      title: "Rénovation Infrastructure Routière",
      description: "Réhabilitation de 25 km de routes rurales avec revêtement bitumineux et signalisation",
      organization: "Ministère des Travaux Publics",
      budget: "5,800,000 KMF",
      deadline: "2024-02-28",
      location: "Fomboni - Nioumachoua",
      island: "Mohéli",
      category: "Infrastructure",
      status: "closing_soon",
      requirements: ["Équipement lourd", "Personnel qualifié", "Assurance RC"]
    },
    {
      id: 3,
      title: "Système d'Irrigation Agricole",
      description: "Installation d'un système d'irrigation moderne pour 200 hectares de terres agricoles",
      organization: "Chambre d'Agriculture",
      budget: "1,200,000 KMF",
      deadline: "2024-03-30",
      location: "Mbéni",
      island: "Grande Comore",
      category: "Agriculture",
      status: "open",
      requirements: ["Expertise irrigation", "Matériel spécialisé", "Garantie 3 ans"]
    },
    {
      id: 4,
      title: "Fourniture Équipements Informatiques",
      description: "Achat et installation de 150 ordinateurs et équipements réseau pour les écoles",
      organization: "Ministère de l'Éducation",
      budget: "3,400,000 KMF",
      deadline: "2024-02-20",
      location: "Mamoudzou",
      island: "Mayotte",
      category: "Éducation",
      status: "closing_soon",
      requirements: ["Distributeur agréé", "Support technique", "Formation incluse"]
    },
    {
      id: 5,
      title: "Aménagement Parc Urbain",
      description: "Création d'un parc urbain de 5 hectares avec aires de jeux, éclairage et végétation",
      organization: "Mairie de Moroni",
      budget: "1,800,000 KMF",
      deadline: "2024-04-10",
      location: "Moroni Centre",
      island: "Grande Comore",
      category: "Environnement",
      status: "open",
      requirements: ["Paysagiste", "Matériaux durables", "Entretien 2 ans"]
    }
  ];

  const filteredTenders = tenders.filter(tender => {
    const matchesSearch = tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tender.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIsland = selectedIsland === 'all' || tender.island === selectedIsland;
    const matchesCategory = selectedCategory === 'all' || tender.category === selectedCategory;
    
    return matchesSearch && matchesIsland && matchesCategory;
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
    <div className="min-h-screen">
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

        {/* Liste des appels d'offres */}
        <div className="space-y-6">
          {filteredTenders.map((tender) => (
            <Card key={tender.id} className="card-hover">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryIcon(tender.category)}</span>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{tender.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Building className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{tender.organization}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <Badge className={getStatusColor(tender.status)}>
                      {tender.status === 'open' ? 'Ouvert' : 
                       tender.status === 'closing_soon' ? 'Expire bientôt' : 'Fermé'}
                    </Badge>
                    <div className="text-sm text-gray-500">
                      {getDaysRemaining(tender.deadline)} jours restants
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-gray-700">{tender.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-sm text-gray-500">Budget</div>
                      <div className="font-semibold">{tender.budget}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-sm text-gray-500">Date limite</div>
                      <div className="font-semibold">{new Date(tender.deadline).toLocaleDateString('fr-FR')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-sm text-gray-500">Localisation</div>
                      <div className="font-semibold">{tender.location}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Exigences principales :</h4>
                  <div className="flex flex-wrap gap-2">
                    {tender.requirements.map((req, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {req}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <Badge variant="outline" className="text-emerald-700 border-emerald-300">
                    📍 {tender.island}
                  </Badge>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Télécharger le dossier
                    </Button>
                    <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-ocean-500">
                      Soumettre une offre
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTenders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucun appel d'offres trouvé avec ces critères.</p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default TendersPage;