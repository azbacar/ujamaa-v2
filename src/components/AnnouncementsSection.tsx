import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, User, ArrowRight } from 'lucide-react';

interface Announcement {
  id: number;
  title: string;
  category: string;
  description: string;
  location: string;
  date: string;
  author: string;
  type: 'urgent' | 'normal' | 'featured';
  price?: string;
}

const announcements: Announcement[] = [
  {
    id: 1,
    title: "Prix du riz en baisse au marché de Volo-Volo",
    category: "Prix & Marchés",
    description: "Le prix du riz importé a diminué de 15% cette semaine suite à l'arrivée d'un nouveau stock. Prix actuel : 1500 FC/kg.",
    location: "Moroni, Grande Comore",
    date: "Il y a 2 heures",
    author: "Direction du Commerce",
    type: "featured"
  },
  {
    id: 2,
    title: "Appel d'offres : Construction d'une école primaire",
    category: "Appels d'Offres",
    description: "Le Ministère de l'Éducation lance un appel d'offres pour la construction d'une école primaire de 6 classes à Sima, Anjouan.",
    location: "Sima, Anjouan",
    date: "Il y a 5 heures",
    author: "Ministère de l'Éducation",
    type: "urgent",
    price: "Budget : 250M FC"
  },
  {
    id: 3,
    title: "Festival culturel de Mohéli - Inscriptions ouvertes",
    category: "Événements",
    description: "Le festival annuel de Mohéli aura lieu du 15 au 17 décembre. Inscriptions ouvertes pour les artistes et artisans locaux.",
    location: "Fomboni, Mohéli",
    date: "Il y a 1 jour",
    author: "Office du Tourisme Mohéli",
    type: "normal"
  },
  {
    id: 4,
    title: "Nouvelle ligne de transport Moroni-Mitsamiouli",
    category: "Transports",
    description: "Mise en service d'une nouvelle ligne de bus reliant Moroni à Mitsamiouli avec 8 rotations quotidiennes.",
    location: "Grande Comore",
    date: "Il y a 1 jour",
    author: "Société de Transport Comorien",
    type: "normal"
  },
  {
    id: 5,
    title: "Campagne de vaccination contre la rougeole",
    category: "Santé",
    description: "Campagne gratuite de vaccination des enfants de 6 mois à 5 ans dans tous les centres de santé des îles.",
    location: "Toutes les îles",
    date: "Il y a 2 jours",
    author: "Ministère de la Santé",
    type: "urgent"
  },
  {
    id: 6,
    title: "Ouverture des inscriptions universitaires 2024-2025",
    category: "Éducation",
    description: "L'Université des Comores ouvre les pré-inscriptions pour l'année académique 2024-2025. Candidatures en ligne jusqu'au 31 janvier.",
    location: "Moroni, Grande Comore",
    date: "Il y a 3 jours",
    author: "Université des Comores",
    type: "featured"
  }
];

const AnnouncementsSection = () => {
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
    <section className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-black gradient-text">
          🤖 Annonces Alimentées par l'IA
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          UJAMAA IA analyse et organise automatiquement les dernières informations pour vous offrir 
          <span className="text-emerald-600 font-semibold"> les annonces les plus pertinentes</span> en temps réel.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="feature-card card-hover group h-full">
            <CardContent className="p-6 h-full flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <Badge variant="secondary" className={`${getTypeColor(announcement.type)} px-3 py-1`}>
                  {getTypeLabel(announcement.type)}
                </Badge>
                <Badge variant="outline" className="text-xs bg-white/50">
                  {announcement.category}
                </Badge>
              </div>

              <h3 className="font-bold text-lg text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors line-clamp-2">
                {announcement.title}
              </h3>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
                {announcement.description}
              </p>

              {announcement.price && (
                <div className="bg-gradient-to-r from-magenta-50 to-magenta-100 p-3 rounded-lg mb-4">
                  <p className="text-magenta-700 font-semibold text-sm">{announcement.price}</p>
                </div>
              )}

              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  <span>{announcement.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>{announcement.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3" />
                  <span>{announcement.author}</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-4 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:shadow-magenta-200/50 transition-all group"
              >
                <span>Lire plus</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center pt-8">
        <Button 
          size="lg" 
          className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-ocean-500 text-white px-12 py-4 rounded-2xl font-bold shadow-xl hover:shadow-magenta-500/50 transition-all text-lg"
        >
          🔍 Voir toutes les annonces
        </Button>
      </div>
    </section>
  );
};

export default AnnouncementsSection;