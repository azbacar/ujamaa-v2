import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdSpace from '@/components/AdSpace';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Share2, Ticket, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import EventRegistrationDialog from '@/components/EventRegistrationDialog';
import { useAuth } from '@/hooks/useAuth';
import FavoriteButton from '@/components/FavoriteButton';
import ReportButton from '@/components/ReportButton';
import CommentSection from '@/components/CommentSection';
import { usePageSEO } from '@/hooks/usePageSEO';

interface Event {
  id: string;
  title: string;
  description: string;
  full_content: string;
  date: string;
  end_date: string | null;
  location: string;
  island: string;
  category: string;
  organizer: string;
  contact_email: string | null;
  contact_phone: string | null;
  price: number;
  currency: string;
  capacity: number | null;
  registered_count: number;
  status: string;
  requires_registration: boolean;
  requires_payment: boolean;
  views: number;
  images: string[] | null;
}

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  usePageSEO({
    title: event ? event.title : 'Événement',
    description: event?.description?.substring(0, 160) || 'Détail d\'un événement aux Comores',
    canonicalPath: id ? `/evenements/${id}` : undefined,
    ogType: 'article',
    keywords: event ? `${event.category}, ${event.island}, événement, comores` : undefined,
  });

  useEffect(() => {
    if (id) {
      fetchEvent().then(() => incrementViews());
      checkRegistration();
    }
  }, [id]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Événement non trouvé');
    } finally {
      setLoading(false);
    }
  };

  const checkRegistration = async () => {
    if (!user || !id) return;

    try {
      const { data } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      setIsRegistered(!!data);
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };

  const incrementViews = async () => {
    if (!id) return;
    
    try {
      const { data } = await supabase.from('events').select('views').eq('id', id).single();
      if (data) {
        await supabase.from('events').update({ views: (data.views || 0) + 1 }).eq('id', id);
      }
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Événement non trouvé</h1>
          <Button onClick={() => navigate('/evenements')}>Retour aux événements</Button>
        </div>
      </div>
    );
  }

  const isUpcoming = new Date(event.date) > new Date();
  const isFull = event.capacity && event.registered_count >= event.capacity;
  const canRegister = isUpcoming && event.requires_registration && !isFull && !isRegistered;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Culturel': return '🎭';
      case 'Éducation': return '📚';
      case 'Sport': return '⚽';
      case 'Commerce': return '🛍️';
      case 'Business': return '💼';
      case 'Formation': return '🎓';
      case 'Professionnel': return '💼';
      case 'Culture': return '🎨';
      default: return '📅';
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Lien copié dans le presse-papiers');
    }
  };

  return (
    <div className="min-h-screen bg-background">
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
                  {!isUpcoming && <Badge variant="secondary">Passé</Badge>}
                  {isFull && isUpcoming && <Badge variant="destructive">Complet</Badge>}
                  {isRegistered && <Badge className="bg-green-500">✓ Inscrit</Badge>}
                </div>
                
                <CardTitle className="text-3xl font-bold mb-4">
                  {event.title}
                </CardTitle>

                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>{new Date(event.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>{new Date(event.date).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>{event.registered_count} inscrits {event.capacity ? `/ ${event.capacity}` : ''}</span>
                  </div>
                </div>
              </CardHeader>
              
              {/* Image Gallery */}
              {event.images && event.images.length > 0 && (
                <CardContent className="pt-0">
                  <div className="relative rounded-xl overflow-hidden mb-4">
                    <img
                      src={event.images[activeImageIndex]}
                      alt={`${event.title} - Image ${activeImageIndex + 1}`}
                      className="w-full h-64 sm:h-80 md:h-96 object-cover"
                    />
                    {event.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setActiveImageIndex(i => (i - 1 + event.images!.length) % event.images!.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full p-1.5 hover:bg-background transition-colors"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setActiveImageIndex(i => (i + 1) % event.images!.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full p-1.5 hover:bg-background transition-colors"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {event.images.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setActiveImageIndex(i)}
                              className={`w-2 h-2 rounded-full transition-colors ${i === activeImageIndex ? 'bg-primary' : 'bg-background/60'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  {event.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {event.images.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImageIndex(i)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === activeImageIndex ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                          <img src={img} alt={`Miniature ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}

              <CardContent>
                {event.requires_payment && (
                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 rounded-lg mb-6">
                    <p className="text-emerald-700 font-semibold flex items-center gap-2">
                      <Ticket className="w-4 h-4" />
                      Prix du billet: {event.price} {event.currency}
                    </p>
                  </div>
                )}

                <div 
                  className="prose prose-lg max-w-none mb-8"
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(event.full_content || event.description) 
                  }}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {canRegister && (
                  <Button 
                    className="w-full bg-gradient-to-r from-emerald-500 to-ocean-500"
                    onClick={() => setShowRegistrationDialog(true)}
                  >
                    <Ticket className="w-4 h-4 mr-2" />
                    S'inscrire maintenant
                  </Button>
                )}
                {isRegistered && (
                  <Button 
                    className="w-full bg-green-500 hover:bg-green-600"
                    disabled
                  >
                    <Ticket className="w-4 h-4 mr-2" />
                    Vous êtes inscrit
                  </Button>
                )}
                <Button className="w-full" variant="outline" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </Button>
                <FavoriteButton contentType="event" contentId={event.id} />
                <ReportButton contentType="event" contentId={event.id} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations pratiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Organisateur</h4>
                  <p className="text-muted-foreground">{event.organizer}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm mb-2">Lieu</h4>
                  <p className="text-muted-foreground">{event.location}</p>
                  <p className="text-sm text-emerald-600">{event.island}</p>
                </div>
                
                {(event.contact_phone || event.contact_email) && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Contact</h4>
                    {event.contact_phone && <p className="text-sm text-muted-foreground">{event.contact_phone}</p>}
                    {event.contact_email && <p className="text-sm text-blue-600">{event.contact_email}</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sidebar ad */}
            <AdSpace size="small" position="sidebar" lazy />
          </div>
        </div>

        {/* Comments */}
        <CommentSection contentType="event" contentId={event.id} />

        {/* Banner ad before footer */}
        <div className="mt-8 flex justify-center">
          <AdSpace size="banner" position="footer" lazy />
        </div>
      </main>
      
      <EventRegistrationDialog
        open={showRegistrationDialog}
        onOpenChange={setShowRegistrationDialog}
        event={{
          id: event.id,
          title: event.title,
          price: event.price,
          currency: event.currency,
          requires_payment: event.requires_payment
        }}
        onSuccess={() => {
          fetchEvent();
          checkRegistration();
        }}
      />
      
      <Footer />
    </div>
  );
};

export default EventDetail;
