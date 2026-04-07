import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdSpace from '@/components/AdSpace';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, MapPin, User, Phone, MessageCircle, Lock, Send } from 'lucide-react';
import SocialShareButtons from '@/components/SocialShareButtons';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import FavoriteButton from '@/components/FavoriteButton';
import ReportButton from '@/components/ReportButton';
import CommentSection from '@/components/CommentSection';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePageSEO } from '@/hooks/usePageSEO';
import { useAuth } from '@/hooks/useAuth';

// Hardcoded fallback announcements for legacy numeric IDs
const legacyAnnouncements = [
  {
    id: 1,
    title: "Prix du riz en baisse au marché de Volo-Volo",
    category: "Prix & Marchés",
    description: "Le prix du riz importé a diminué de 15% cette semaine.",
    fullContent: `<h3>Détails de la baisse des prix</h3><p>Le kilogramme de riz importé est désormais vendu à <strong>1500 FC</strong>.</p>`,
    location: "Moroni, Grande Comore",
    date: "Il y a 2 heures",
    author: "Direction du Commerce",
    type: "featured" as const,
    tags: ["prix", "marché", "alimentation"],
  },
];

interface DbAnnouncement {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  created_at: string;
  type: string;
  author_id: string;
  contact_phone: string | null;
  contact_whatsapp: string | null;
}

interface AuthorInfo {
  account_type: string;
}

const AnnouncementDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [dbItem, setDbItem] = useState<DbAnnouncement | null>(null);
  const [authorInfo, setAuthorInfo] = useState<AuthorInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const seoTitle = dbItem?.title || legacyAnnouncements.find(a => a.id === parseInt(id || '0'))?.title;
  usePageSEO({
    title: seoTitle || 'Annonce',
    description: dbItem?.description?.substring(0, 160) || 'Détail d\'une annonce sur Ujamaan',
    canonicalPath: id ? `/annonces/${id}` : undefined,
    ogType: 'article',
    keywords: dbItem?.category ? `${dbItem.category}, annonce, comores` : undefined,
  });

  // Check if ID looks like a UUID
  const isUuid = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  useEffect(() => {
    if (!isUuid) {
      setLoading(false);
      return;
    }

    const fetchItem = async () => {
      try {
        const { data, error } = await supabase
          .from('content_items')
          .select('id, title, description, category, created_at, type, author_id, contact_phone, contact_whatsapp')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        console.log('AnnouncementDetail: item loaded', { id: data?.id, phone: data?.contact_phone, whatsapp: data?.contact_whatsapp });
        setDbItem(data);

        // Fetch author account type to check Pro status
        if (data?.author_id) {
          const { data: userData } = await supabase
            .from('users')
            .select('account_type')
            .eq('id', data.author_id)
            .maybeSingle();
          setAuthorInfo(userData);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id, isUuid]);

  // Legacy numeric ID lookup
  const legacyItem = !isUuid ? legacyAnnouncements.find(a => a.id === parseInt(id || '0')) : null;

  const isAuthorPro = authorInfo?.account_type === 'pro';
  const formatPhone = (phone: string) => phone.replace(/\s+/g, '');

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return "Il y a moins d'une heure";
    if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
        <Footer />
      </div>
    );
  }

  // Render DB item
  if (dbItem) {
    return (
      <div className="min-h-screen bg-background">
        <Header currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
        <main className="container mx-auto px-6 py-12">
          <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 px-3 py-1">
                      📢 Annonce
                    </Badge>
                    {dbItem.category && (
                      <Badge variant="outline">{dbItem.category}</Badge>
                    )}
                  </div>
                  <CardTitle className="text-3xl font-bold text-foreground mb-4">
                    {dbItem.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{getRelativeTime(dbItem.created_at)}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(dbItem.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-lg max-w-none">
                    <p className="text-foreground whitespace-pre-line">
                      {dbItem.description || 'Aucune description disponible.'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-8">
                <CommentSection contentType="announcement" contentId={dbItem.id} />
              </div>
            </div>

            <div className="space-y-6">
              {/* Contact téléphone */}
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="text-lg">📞 Contact</CardTitle>
                </CardHeader>
                <CardContent>
                  {isAuthorPro && dbItem.contact_phone ? (
                    <div className="space-y-3">
                      {isMobile ? (
                        <Button 
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
                          onClick={() => window.open(`tel:${formatPhone(dbItem.contact_phone!)}`, '_self')}
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Appeler l'annonceur
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 p-3 bg-background rounded-lg border">
                          <Phone className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-foreground">{dbItem.contact_phone}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <Lock className="w-8 h-8 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        Les coordonnées de contact sont disponibles uniquement pour les annonceurs Pro.
                      </p>
                      <Button variant="outline" size="sm" onClick={() => window.location.href = '/pro'}>
                        Devenir Pro
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact WhatsApp - visible uniquement si Pro */}
              {isAuthorPro && dbItem.contact_whatsapp && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardContent className="pt-6">
                    <Button 
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                      onClick={() => window.open(`https://wa.me/${formatPhone(dbItem.contact_whatsapp!)}`, '_blank')}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contacter via WhatsApp
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <SocialShareButtons title={dbItem.title} description={dbItem.description || ''} />
                  <FavoriteButton contentType="announcement" contentId={dbItem.id} />
                  <ReportButton contentType="announcement" contentId={dbItem.id} />
                </CardContent>
              </Card>

              {/* Sidebar ad */}
              <AdSpace size="small" position="sidebar" lazy />
            </div>
          </div>
        {/* Banner ad before footer */}
        <div className="mt-8 flex justify-center">
          <AdSpace size="banner" position="footer" lazy />
        </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Legacy hardcoded item
  if (legacyItem) {
    return (
      <div className="min-h-screen bg-background">
        <Header currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
        <main className="container mx-auto px-6 py-12">
          <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold">{legacyItem.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-1"><MapPin className="w-4 h-4" />{legacyItem.location}</div>
                <div className="flex items-center gap-1"><User className="w-4 h-4" />{legacyItem.author}</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(legacyItem.fullContent) }} />
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Not found
  return (
    <div className="min-h-screen bg-background">
      <Header currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Annonce non trouvée</h1>
          <Button onClick={() => navigate('/annonces')}>Retour aux annonces</Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AnnouncementDetail;
