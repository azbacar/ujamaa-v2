import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Share2, Heart, Ticket } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useState } from 'react';

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
    <div className="min-h-screen">
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
                  dangerouslySetInnerHTML={{ __html: event.fullContent }}
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