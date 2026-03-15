import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdSpace from '@/components/AdSpace';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, MapPin, User, Share2, Phone, MessageCircle, Lock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import FavoriteButton from '@/components/FavoriteButton';
import ReportButton from '@/components/ReportButton';
import CommentSection from '@/components/CommentSection';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

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
}

const AnnouncementDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [dbItem, setDbItem] = useState<DbAnnouncement | null>(null);
  const [loading, setLoading] = useState(true);

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
          .select('id, title, description, category, created_at, type')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        setDbItem(data);
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" variant="outline" onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: dbItem.title, url: window.location.href });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                    }
                  }}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
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
