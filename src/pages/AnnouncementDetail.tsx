import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, MapPin, User, Share2, Heart } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useState } from 'react';

interface Announcement {
  id: number;
  title: string;
  category: string;
  description: string;
  fullContent: string;
  location: string;
  date: string;
  author: string;
  type: 'urgent' | 'normal' | 'featured';
  price?: string;
  tags: string[];
  relatedLinks?: string[];
}

const announcements: Announcement[] = [
  {
    id: 1,
    title: "Prix du riz en baisse au marché de Volo-Volo",
    category: "Prix & Marchés",
    description: "Le prix du riz importé a diminué de 15% cette semaine suite à l'arrivée d'un nouveau stock. Prix actuel : 1500 FC/kg.",
    fullContent: `
      <h3>Détails de la baisse des prix</h3>
      <p>Une excellente nouvelle pour les consommateurs comoriens : le prix du riz importé a connu une baisse significative de 15% cette semaine au marché de Volo-Volo à Moroni.</p>
      
      <h4>Nouveau prix en vigueur</h4>
      <p>Le kilogramme de riz importé de qualité supérieure est désormais vendu à <strong>1500 FC</strong>, contre 1750 FC la semaine dernière.</p>
      
      <h4>Causes de cette baisse</h4>
      <ul>
        <li>Arrivée d'un nouveau stock important de riz en provenance de Madagascar</li>
        <li>Amélioration des conditions de transport maritime</li>
        <li>Négociations favorables avec les fournisseurs</li>
      </ul>
      
      <h4>Impact sur les autres produits</h4>
      <p>Cette baisse pourrait également influencer positivement les prix d'autres denrées de base dans les prochaines semaines.</p>
      
      <h4>Recommandations</h4>
      <p>Les autorités recommandent aux commerçants de répercuter cette baisse sur les prix de vente au détail pour le bénéfice de tous les consommateurs.</p>
    `,
    location: "Moroni, Grande Comore",
    date: "Il y a 2 heures",
    author: "Direction du Commerce",
    type: "featured",
    tags: ["prix", "marché", "alimentation", "économie"],
    relatedLinks: [
      "Évolution des prix des denrées de base",
      "Marchés locaux - Guide complet",
      "Politique commerciale nationale"
    ]
  },
  {
    id: 2,
    title: "Appel d'offres : Construction d'une école primaire",
    category: "Appels d'Offres",
    description: "Le Ministère de l'Éducation lance un appel d'offres pour la construction d'une école primaire de 6 classes à Sima, Anjouan.",
    fullContent: `
      <h3>Projet de construction d'école primaire</h3>
      <p>Le Ministère de l'Éducation Nationale lance un appel d'offres public pour la construction d'une école primaire moderne de 6 classes à Sima, sur l'île d'Anjouan.</p>
      
      <h4>Caractéristiques du projet</h4>
      <ul>
        <li><strong>Nombre de classes :</strong> 6 salles de classe spacieuses</li>
        <li><strong>Capacité :</strong> 240 élèves (40 par classe)</li>
        <li><strong>Surface totale :</strong> 800 m² de construction</li>
        <li><strong>Équipements :</strong> Bibliothèque, salle informatique, cantine</li>
      </ul>
      
      <h4>Budget alloué</h4>
      <p>Le budget total du projet s'élève à <strong>250 millions de francs comoriens</strong>, financé par le gouvernement avec l'appui de partenaires internationaux.</p>
      
      <h4>Critères de sélection</h4>
      <ul>
        <li>Expérience minimale de 5 ans dans la construction scolaire</li>
        <li>Certification en construction durable</li>
        <li>Équipe technique qualifiée</li>
        <li>Respect des délais de livraison</li>
      </ul>
      
      <h4>Calendrier</h4>
      <p>Les travaux devront commencer en avril 2024 et se terminer avant la rentrée scolaire de septembre 2024.</p>
    `,
    location: "Sima, Anjouan",
    date: "Il y a 5 heures",
    author: "Ministère de l'Éducation",
    type: "urgent",
    price: "Budget : 250M FC",
    tags: ["éducation", "construction", "appel d'offres", "Anjouan"],
    relatedLinks: [
      "Autres appels d'offres en cours",
      "Programmes éducatifs nationaux",
      "Développement rural d'Anjouan"
    ]
  },
  // Ajout des autres annonces...
];

const AnnouncementDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  
  const announcement = announcements.find(a => a.id === parseInt(id || '0'));

  if (!announcement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Annonce non trouvée</h1>
          <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'featured':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'urgent':
        return '🚨 Urgent';
      case 'featured':
        return '⭐ À la une';
      default:
        return '📢 Nouveau';
    }
  };

  return (
    <div className="min-h-screen">
      <Header currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
      
      <main className="container mx-auto px-6 py-12">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <Badge variant="secondary" className={`${getTypeColor(announcement.type)} px-3 py-1`}>
                    {getTypeLabel(announcement.type)}
                  </Badge>
                  <Badge variant="outline" className="bg-white/50">
                    {announcement.category}
                  </Badge>
                </div>
                
                <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
                  {announcement.title}
                </CardTitle>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{announcement.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{announcement.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{announcement.author}</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {announcement.price && (
                  <div className="bg-gradient-to-r from-magenta-50 to-magenta-100 p-4 rounded-lg mb-6">
                    <p className="text-magenta-700 font-semibold">{announcement.price}</p>
                  </div>
                )}

                <div 
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: announcement.fullContent }}
                />

                <div className="mt-8 pt-6 border-t">
                  <h4 className="font-semibold mb-3">Mots-clés :</h4>
                  <div className="flex flex-wrap gap-2">
                    {announcement.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-emerald-700 border-emerald-300">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </Button>
                <Button className="w-full" variant="outline">
                  <Heart className="w-4 h-4 mr-2" />
                  Sauvegarder
                </Button>
              </CardContent>
            </Card>

            {announcement.relatedLinks && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Liens connexes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {announcement.relatedLinks.map((link, index) => (
                      <Button 
                        key={index} 
                        variant="ghost" 
                        className="w-full justify-start text-left h-auto p-2"
                      >
                        {link}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Publié par :</strong> {announcement.author}</p>
                  <Button size="sm" className="w-full bg-gradient-to-r from-emerald-500 to-ocean-500">
                    Contacter l'auteur
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AnnouncementDetail;