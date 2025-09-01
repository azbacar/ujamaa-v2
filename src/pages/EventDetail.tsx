import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Share2, Heart, Ticket } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useState } from 'react';
import DOMPurify from 'dompurify';

interface Event {
  id: number;
  title: string;
  description: string;
  fullContent: string;
  date: string;
  time: string;
  location: string;
  island: string;
  category: string;
  organizer: string;
  attendees: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  price?: string;
  contact: {
    phone: string;
    email: string;
  };
  program: string[];
}

const events: Event[] = [
  {
    id: 1,
    title: "Festival Culturel de Moroni",
    description: "Célébration de la culture comorienne avec danses traditionnelles, musique et artisanat local",
    fullContent: `
      <h3>Un événement culturel exceptionnel</h3>
      <p>Le Festival Culturel de Moroni est l'événement phare de l'année qui célèbre la richesse et la diversité de la culture comorienne. Cette 15ème édition promet d'être encore plus spectaculaire que les précédentes.</p>
      
      <h4>Au programme de cette édition</h4>
      <p>Trois jours de festivités vous attendent avec des spectacles de danses traditionnelles, des concerts de musique comorienne contemporaine, des expositions d'artisanat local et des dégustations de spécialités culinaires.</p>
      
      <h4>Les temps forts</h4>
      <ul>
        <li><strong>Vendredi 15h :</strong> Cérémonie d'ouverture officielle</li>
        <li><strong>Samedi 20h :</strong> Grand concert de musique traditionnelle</li>
        <li><strong>Dimanche 14h :</strong> Défilé de mode traditionnelle</li>
      </ul>
      
      <h4>Exposants et artisans</h4>
      <p>Plus de 50 artisans locaux présenteront leurs créations : bijoux traditionnels, tissus colorés, sculptures sur bois, poteries et bien d'autres trésors de l'artisanat comorien.</p>
    `,
    date: "2024-02-15",
    time: "14:00",
    location: "Place de l'Indépendance",
    island: "Grande Comore",
    category: "Culturel",
    organizer: "Ministère de la Culture",
    attendees: 2000,
    status: "upcoming",
    price: "Entrée gratuite",
    contact: {
      phone: "+269 73 25 67",
      email: "festival@culture.gouv.km"
    },
    program: [
      "14h00 - Cérémonie d'ouverture",
      "15h30 - Spectacle de danses traditionnelles",
      "17h00 - Exposition d'artisanat",
      "19h00 - Concert de musique locale",
      "21h00 - Clôture de la première journée"
    ]
  },
  {
    id: 2,
    title: "Conférence sur l'Agriculture Durable",
    description: "Conférence internationale sur les pratiques agricoles durables adaptées au climat tropical des Comores",
    fullContent: `
      <h3>Agriculture Durable aux Comores</h3>
      <p>Une conférence internationale majeure réunissant experts, agriculteurs et décideurs pour discuter de l'avenir de l'agriculture comorienne face aux défis climatiques.</p>
      
      <h4>Thèmes abordés</h4>
      <ul>
        <li>Techniques d'irrigation économes en eau</li>
        <li>Cultures résistantes au changement climatique</li>
        <li>Agriculture biologique et permaculture</li>
        <li>Commercialisation des produits locaux</li>
      </ul>
      
      <h4>Intervenants prestigieux</h4>
      <p>Des experts internationaux en agriculture tropicale, des représentants de la FAO et des agriculteurs innovants de la région.</p>
      
      <h4>Ateliers pratiques</h4>
      <p>Sessions de démonstration sur les nouvelles techniques de culture et de conservation des sols.</p>
    `,
    date: "2024-01-20",
    time: "09:00",
    location: "Centre de Conférences de Moroni",
    island: "Grande Comore",
    category: "Professionnel",
    organizer: "Ministère de l'Agriculture",
    attendees: 150,
    status: "upcoming",
    price: "Gratuit",
    contact: {
      phone: "+269 773 45 67",
      email: "agriculture@comores.km"
    },
    program: ["Accueil et café", "Conférences plénières", "Ateliers thématiques", "Démonstrations pratiques", "Table ronde"]
  },
  {
    id: 3,
    title: "Tournoi de Football Inter-îles",
    description: "Championnat de football opposant les équipes des quatre îles de l'archipel comorien",
    fullContent: `
      <h3>Grand Tournoi Inter-îles</h3>
      <p>Le tournoi de football le plus attendu de l'année ! Les meilleures équipes de chaque île s'affrontent pour le titre de champion inter-îles.</p>
      
      <h4>Équipes participantes</h4>
      <ul>
        <li><strong>Grande Comore :</strong> AS Moroni et FC Iconi</li>
        <li><strong>Anjouan :</strong> Club Sportif Anjouanais et AS Mutsamudu</li>
        <li><strong>Mohéli :</strong> Union Sportive Mohélienne</li>
        <li><strong>Mayotte :</strong> FC Mamoudzou (équipe invitée)</li>
      </ul>
      
      <h4>Format du tournoi</h4>
      <p>Tournoi à élimination directe sur 3 jours avec finales le dimanche après-midi.</p>
      
      <h4>Prix et récompenses</h4>
      <p>Trophée inter-îles, médailles individuelles et prix de 500 000 FC pour l'équipe gagnante.</p>
    `,
    date: "2024-01-25",
    time: "15:00",
    location: "Stade Said Mohamed Cheikh",
    island: "Grande Comore",
    category: "Sport",
    organizer: "Fédération Comorienne de Football",
    attendees: 2000,
    status: "upcoming",
    price: "2000 FC",
    contact: {
      phone: "+269 773 89 12",
      email: "football@comores.km"
    },
    program: ["Cérémonie d'ouverture", "Quarts de finale", "Demi-finales", "Finale 3ème place", "Grande finale"]
  },
  {
    id: 4,
    title: "Salon de l'Artisanat Local",
    description: "Exposition-vente des créations artisanales des quatre îles de l'Union des Comores",
    fullContent: `
      <h3>Artisanat Comorien à l'Honneur</h3>
      <p>Découvrez et achetez les plus belles créations artisanales des Comores dans ce salon annuel qui met en valeur le savoir-faire traditionnel.</p>
      
      <h4>Artisans participants</h4>
      <ul>
        <li>Sculpteurs sur bois d'ébène</li>
        <li>Tisserands et brodeurs traditionnels</li>
        <li>Bijoutiers et orfèvres</li>
        <li>Potiers et céramistes</li>
        <li>Vanniers et artisans du rotin</li>
      </ul>
      
      <h4>Animations spéciales</h4>
      <p>Démonstrations en direct, ateliers d'initiation pour enfants et adultes, conférences sur les techniques traditionnelles.</p>
      
      <h4>Produits phares</h4>
      <p>Coffres sculptés, tissus brodés, bijoux en or et argent, poteries décoratives et objets utilitaires.</p>
    `,
    date: "2024-02-01",
    time: "10:00",
    location: "Palais des Congrès de Moroni",
    island: "Grande Comore",
    category: "Culture",
    organizer: "Chambre des Métiers",
    attendees: 500,
    status: "upcoming",
    price: "1000 FC",
    contact: {
      phone: "+269 773 34 56",
      email: "artisanat@comores.km"
    },
    program: ["Ouverture officielle", "Visite guidée", "Démonstrations", "Ateliers participatifs", "Vente aux enchères"]
  },
  {
    id: 5,
    title: "Séminaire sur le Tourisme Durable",
    description: "Formation et sensibilisation sur le développement d'un tourisme respectueux de l'environnement comorien",
    fullContent: `
      <h3>Tourisme Durable aux Comores</h3>
      <p>Un séminaire essentiel pour développer un tourisme respectueux de l'environnement et bénéfique pour les communautés locales.</p>
      
      <h4>Objectifs du séminaire</h4>
      <ul>
        <li>Préserver les écosystèmes marins et terrestres</li>
        <li>Valoriser le patrimoine culturel local</li>
        <li>Créer des emplois durables dans le tourisme</li>
        <li>Former les acteurs du secteur touristique</li>
      </ul>
      
      <h4>Modules de formation</h4>
      <p>Écotourisme, tourisme communautaire, gestion des déchets, accueil touristique, marketing vert.</p>
      
      <h4>Participants ciblés</h4>
      <p>Hôteliers, guides touristiques, restaurateurs, transporteurs, associations locales et institutions publiques.</p>
      
      <h4>Certification</h4>
      <p>Délivrance d'un certificat de participation reconnu par le Ministère du Tourisme.</p>
    `,
    date: "2024-02-10",
    time: "08:30",
    location: "Hôtel Itsandra Beach",
    island: "Grande Comore",
    category: "Formation",
    organizer: "Office National du Tourisme",
    attendees: 80,
    status: "upcoming",
    price: "15000 FC",
    contact: {
      phone: "+269 773 67 89",
      email: "tourisme@comores.km"
    },
    program: ["Accueil et inscription", "Conférences thématiques", "Ateliers pratiques", "Visite terrain", "Remise des certificats"]
  }
];

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  
  const event = events.find(e => e.id === parseInt(id || '0'));

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Événement non trouvé</h1>
          <Button onClick={() => navigate('/evenements')}>Retour aux événements</Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Culturel': return '🎭';
      case 'Éducation': return '📚';
      case 'Sport': return '⚽';
      case 'Commerce': return '🛍️';
      case 'Business': return '💼';
      default: return '📅';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
      
      <main className="container mx-auto px-6 py-12">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/evenements')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux événements
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getCategoryIcon(event.category)}</span>
                    <Badge variant="outline">{event.category}</Badge>
                  </div>
                  <Badge className={getStatusColor(event.status)}>
                    {event.status === 'upcoming' ? 'À venir' : 
                     event.status === 'ongoing' ? 'En cours' : 'Terminé'}
                  </Badge>
                </div>
                
                <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
                  {event.title}
                </CardTitle>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>{new Date(event.date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>{event.attendees} participants</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {event.price && (
                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 rounded-lg mb-6">
                    <p className="text-emerald-700 font-semibold flex items-center gap-2">
                      <Ticket className="w-4 h-4" />
                      {event.price}
                    </p>
                  </div>
                )}

                <div 
                  className="prose prose-lg max-w-none mb-8"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(event.fullContent) }}
                />

                <Card className="bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Programme détaillé</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {event.program.map((item, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                          <span className="text-gray-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-ocean-500">
                  <Ticket className="w-4 h-4 mr-2" />
                  S'inscrire
                </Button>
                <Button className="w-full" variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </Button>
                <Button className="w-full" variant="outline">
                  <Heart className="w-4 h-4 mr-2" />
                  Ajouter aux favoris
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations pratiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Organisateur</h4>
                  <p className="text-gray-600">{event.organizer}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm mb-2">Lieu</h4>
                  <p className="text-gray-600">{event.location}</p>
                  <p className="text-sm text-emerald-600">{event.island}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm mb-2">Contact</h4>
                  <p className="text-sm text-gray-600">{event.contact.phone}</p>
                  <p className="text-sm text-blue-600">{event.contact.email}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Localisation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 h-32 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">Carte interactive</span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  Voir sur la carte
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default EventDetail;