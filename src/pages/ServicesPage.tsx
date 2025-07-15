import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, MapPin, Phone, Mail, Search, Building2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Service {
  id: number;
  name: string;
  description: string;
  category: string;
  address: string;
  island: string;
  phone: string;
  email: string;
  hours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
  status: 'open' | 'closed' | 'limited';
  services: string[];
}

const ServicesPage = () => {
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIsland, setSelectedIsland] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const services: Service[] = [
    {
      id: 1,
      name: "Préfecture de la Grande Comore",
      description: "Services administratifs, cartes d'identité, passeports et autorisations diverses",
      category: "Administration",
      address: "Avenue de l'Indépendance, Moroni",
      island: "Grande Comore",
      phone: "+269 73 10 89",
      email: "prefecture.gc@gouv.km",
      hours: {
        weekdays: "7h30 - 15h30",
        saturday: "8h00 - 12h00",
        sunday: "Fermé"
      },
      status: "open",
      services: ["Carte d'identité", "Passeport", "Extrait de naissance", "Légalisation"]
    },
    {
      id: 2,
      name: "Hôpital National El-Maarouf",
      description: "Soins médicaux généraux et spécialisés, urgences 24h/24",
      category: "Santé",
      address: "Route de Badjanani, Moroni",
      island: "Grande Comore",
      phone: "+269 73 20 45",
      email: "hopital.elmaarouf@sante.km",
      hours: {
        weekdays: "24h/24",
        saturday: "24h/24",
        sunday: "24h/24"
      },
      status: "open",
      services: ["Consultation", "Urgences", "Hospitalisation", "Laboratoire", "Radiologie"]
    },
    {
      id: 3,
      name: "Poste Centrale de Mutsamudu",
      description: "Services postaux, transferts d'argent et télécommunications",
      category: "Communication",
      address: "Place du Marché, Mutsamudu",
      island: "Anjouan",
      phone: "+269 71 05 67",
      email: "poste.mutsamudu@comtel.km",
      hours: {
        weekdays: "7h00 - 16h00",
        saturday: "8h00 - 13h00",
        sunday: "Fermé"
      },
      status: "open",
      services: ["Courrier", "Colis", "Transfert d'argent", "Internet"]
    },
    {
      id: 4,
      name: "Centre de Formation Professionnelle",
      description: "Formation technique et professionnelle dans divers métiers",
      category: "Éducation",
      address: "Quartier Mdé, Fomboni",
      island: "Mohéli",
      phone: "+269 72 30 12",
      email: "cfp.moheli@education.km",
      hours: {
        weekdays: "7h30 - 16h30",
        saturday: "8h00 - 12h00",
        sunday: "Fermé"
      },
      status: "open",
      services: ["Mécanique", "Électricité", "Couture", "Informatique", "Agriculture"]
    },
    {
      id: 5,
      name: "Bureau des Douanes",
      description: "Contrôle douanier, déclarations d'importation et d'exportation",
      category: "Commerce",
      address: "Port de Mamoudzou",
      island: "Mayotte",
      phone: "+262 269 60 10 20",
      email: "douanes.mayotte@douanes.fr",
      hours: {
        weekdays: "7h00 - 18h00",
        saturday: "8h00 - 12h00",
        sunday: "Service d'urgence uniquement"
      },
      status: "open",
      services: ["Déclaration import/export", "Contrôle marchandises", "Taxes douanières"]
    },
    {
      id: 6,
      name: "Tribunal de Première Instance",
      description: "Services judiciaires, affaires civiles et pénales",
      category: "Justice",
      address: "Avenue des Tribunaux, Moroni",
      island: "Grande Comore",
      phone: "+269 73 15 20",
      email: "tribunal.moroni@justice.km",
      hours: {
        weekdays: "8h00 - 15h00",
        saturday: "Fermé",
        sunday: "Fermé"
      },
      status: "limited",
      services: ["Affaires civiles", "Affaires pénales", "État civil", "Notariat"]
    }
  ];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIsland = selectedIsland === 'all' || service.island === selectedIsland;
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    
    return matchesSearch && matchesIsland && matchesCategory;
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

        {/* Liste des services */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredServices.map((service) => (
            <Card key={service.id} className="card-hover">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryIcon(service.category)}</span>
                    <div>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {service.category}
                      </Badge>
                    </div>
                  </div>
                  <Badge className={getStatusColor(service.status)}>
                    {service.status === 'open' ? 'Ouvert' : 
                     service.status === 'limited' ? 'Service limité' : 'Fermé'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-gray-700">{service.description}</p>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600 mt-1" />
                    <div>
                      <div className="font-medium">{service.address}</div>
                      <div className="text-sm text-gray-600">{service.island}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span className="font-mono">{service.phone}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    <span className="text-blue-600">{service.email}</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold">Horaires d'ouverture</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Lun-Ven:</span> {service.hours.weekdays}</div>
                    <div><span className="font-medium">Samedi:</span> {service.hours.saturday}</div>
                    <div><span className="font-medium">Dimanche:</span> {service.hours.sunday}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Services proposés :</h4>
                  <div className="flex flex-wrap gap-2">
                    {service.services.map((srv, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {srv}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <Badge variant="outline" className="text-emerald-700 border-emerald-300">
                    📍 {service.island}
                  </Badge>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm">
                      <Building2 className="w-4 h-4 mr-2" />
                      Voir sur la carte
                    </Button>
                    <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-ocean-500">
                      Contacter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucun service trouvé avec ces critères.</p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default ServicesPage;