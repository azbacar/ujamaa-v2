import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdSpace from '@/components/AdSpace';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Phone, MessageCircle, Lock } from 'lucide-react';
import SocialShareButtons from '@/components/SocialShareButtons';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FavoriteButton from '@/components/FavoriteButton';
import ReportButton from '@/components/ReportButton';
import CommentSection from '@/components/CommentSection';
import TenderSubmissionForm from '@/components/TenderSubmissionForm';
import ContactDisplay from '@/components/ContactDisplay';
import { useViewTracker } from '@/hooks/useViewTracker';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  created_at: string;
  type: string;
  author_id: string;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  reference_number?: string | null;
  procurement_type?: string | null;
  contracting_authority?: string | null;
  budget_estimate?: number | null;
  currency?: string | null;
  guarantee_amount?: number | null;
  lots_count?: number | null;
  deadline_at?: string | null;
  opening_at?: string | null;
  opening_location?: string | null;
  submission_location?: string | null;
  island?: string | null;
  images?: string[] | null;
  attachments?: Array<{ name: string; url: string; size?: number }> | null;
  price?: number | null;
  location?: string | null;
  service_subtype?: string | null;
}

const SERVICE_SUBTYPE_LABELS: Record<string, string> = {
  atelier: '🛠️ Atelier / Réparation',
  service_public: '🏛️ Service public / Administration',
  point_eau: '🚰 Point d\'eau',
  point_ravitaillement: '⛽ Point de ravitaillement',
  sante: '🏥 Santé / Pharmacie',
  education: '🎓 Éducation / Formation',
  transport: '🚐 Transport',
  banque_finance: '🏦 Banque / Finance',
  telecom: '📡 Télécom / Internet',
  commerce: '🛒 Commerce / Boutique',
  artisan: '👷 Artisan / Construction',
  autre_service: '🔧 Autre service',
};


const PROCUREMENT_LABELS: Record<string, string> = {
  aoo: 'Appel d\'offres ouvert',
  aor: 'Appel d\'offres restreint',
  ami: 'Manifestation d\'intérêt',
  consultation: 'Consultation restreinte',
  gre_a_gre: 'Gré à gré',
};

interface AuthorInfo {
  account_type: string;
}

interface ContentDetailPageProps {
  contentType: 'tender' | 'service';
  label: string;
  icon: string;
  backPath: string;
}

const ContentDetailPage = ({ contentType, label, icon, backPath }: ContentDetailPageProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [item, setItem] = useState<ContentItem | null>(null);
  const [authorInfo, setAuthorInfo] = useState<AuthorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);

  useViewTracker('content_item', item?.id);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      try {
        const SAFE_COLS = 'id, title, description, category, created_at, type, author_id, reference_number, procurement_type, contracting_authority, budget_estimate, currency, guarantee_amount, lots_count, deadline_at, opening_at, opening_location, submission_location, island, images, attachments, price, location, service_subtype';
        const { data, error } = await supabase
          .from('content_items')
          .select(user ? `${SAFE_COLS}, contact_phone, contact_whatsapp` : SAFE_COLS)
          .eq('id', id)
          .eq('type', contentType)
          .maybeSingle();

        if (error) throw error;
        setItem(data as any);

        const dataAny = data as any;
        if (dataAny?.author_id) {
          const { data: userData } = await supabase
            .from('users_pro_status' as any)
            .select('is_pro')
            .eq('id', dataAny.author_id)
            .maybeSingle();
          setAuthorInfo({ account_type: (userData as any)?.is_pro ? 'pro' : 'free' } as any);
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id, contentType, user]);

  const isAuthorPro = authorInfo?.account_type === 'pro' || authorInfo?.account_type === 'enterprise';

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return "Il y a moins d'une heure";
    if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  };

  const formatPhone = (phone: string) => phone.replace(/\s+/g, '');

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

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Header currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">{icon} {label} non trouvé(e)</h1>
            <Button onClick={() => navigate(backPath)}>Retour</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

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
                    {icon} {label}
                  </Badge>
                  {item.category && (
                    <Badge variant="outline">{item.category}</Badge>
                  )}
                </div>
                <CardTitle className="text-3xl font-bold text-foreground mb-4">
                  {item.title}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{getRelativeTime(item.created_at)}</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {item.images && item.images.length > 0 && (
                  <div className={`grid gap-2 ${item.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
                    {item.images.map((src, i) => (
                      <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="block aspect-video overflow-hidden rounded-lg border bg-muted">
                        <img src={src} alt={`${item.title} - photo ${i + 1}`} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                      </a>
                    ))}
                  </div>
                )}
                {(item.service_subtype || item.price != null || item.location) && (
                  <div className="flex flex-wrap gap-2">
                    {item.service_subtype && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary text-sm px-3 py-1.5">
                        {SERVICE_SUBTYPE_LABELS[item.service_subtype] || item.service_subtype}
                      </Badge>
                    )}
                    {item.price != null && (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-sm px-3 py-1.5">
                        💰 {item.price.toLocaleString('fr-FR')} {item.currency || 'FC'}
                      </Badge>
                    )}
                    {item.location && (
                      <Badge variant="outline" className="text-sm px-3 py-1.5">
                        📍 {item.location}
                      </Badge>
                    )}
                  </div>
                )}
                <div className="prose prose-lg max-w-none">
                  <p className="text-foreground whitespace-pre-line">
                    {item.description || 'Aucune description disponible.'}
                  </p>
                </div>


                {contentType === 'tender' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-muted/40 p-4 rounded-lg border border-border">
                    {item.reference_number && (
                      <div><div className="text-xs text-muted-foreground">N° de référence</div><div className="font-mono font-medium">{item.reference_number}</div></div>
                    )}
                    {item.procurement_type && (
                      <div><div className="text-xs text-muted-foreground">Type de procédure</div><div className="font-medium">{PROCUREMENT_LABELS[item.procurement_type] || item.procurement_type}</div></div>
                    )}
                    {item.contracting_authority && (
                      <div className="sm:col-span-2"><div className="text-xs text-muted-foreground">Autorité contractante</div><div className="font-medium">{item.contracting_authority}</div></div>
                    )}
                    {item.budget_estimate != null && (
                      <div><div className="text-xs text-muted-foreground">Budget estimé</div><div className="font-medium">{item.budget_estimate.toLocaleString('fr-FR')} {item.currency || 'KMF'}</div></div>
                    )}
                    {item.guarantee_amount != null && (
                      <div><div className="text-xs text-muted-foreground">Garantie de soumission</div><div className="font-medium">{item.guarantee_amount.toLocaleString('fr-FR')} {item.currency || 'KMF'}</div></div>
                    )}
                    {item.lots_count != null && item.lots_count > 0 && (
                      <div><div className="text-xs text-muted-foreground">Nombre de lots</div><div className="font-medium">{item.lots_count}</div></div>
                    )}
                    {item.island && (
                      <div><div className="text-xs text-muted-foreground">Île</div><div className="font-medium capitalize">{item.island.replace('-', ' ')}</div></div>
                    )}
                    {item.deadline_at && (
                      <div><div className="text-xs text-muted-foreground">Date limite de dépôt</div><div className="font-medium">{new Date(item.deadline_at).toLocaleString('fr-FR')}</div></div>
                    )}
                    {item.opening_at && (
                      <div><div className="text-xs text-muted-foreground">Ouverture des plis</div><div className="font-medium">{new Date(item.opening_at).toLocaleString('fr-FR')}</div></div>
                    )}
                    {item.submission_location && (
                      <div className="sm:col-span-2"><div className="text-xs text-muted-foreground">Lieu de dépôt</div><div className="font-medium">{item.submission_location}</div></div>
                    )}
                    {item.opening_location && (
                      <div className="sm:col-span-2"><div className="text-xs text-muted-foreground">Lieu d'ouverture</div><div className="font-medium">{item.opening_location}</div></div>
                    )}
                  </div>
                )}

                {contentType === 'tender' && Array.isArray(item.attachments) && item.attachments.length > 0 && (
                  <div className="bg-muted/40 p-4 rounded-lg border border-border">
                    <h3 className="text-sm font-semibold mb-3">📎 Documents de l'appel d'offres</h3>
                    <ul className="space-y-2">
                      {item.attachments.map((att, i) => (
                        <li key={i}>
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between gap-2 p-2 rounded border bg-background hover:bg-muted transition"
                          >
                            <span className="truncate text-sm">📄 {att.name}</span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {att.size ? `${(att.size / 1024 / 1024).toFixed(2)} Mo` : 'Télécharger'}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-8">
              <CommentSection contentType={contentType} contentId={item.id} />
            </div>
          </div>

          <div className="space-y-6">
            {/* Action principale selon le type */}
            {contentType === 'tender' && (
              <Card className="border-emerald-200 bg-emerald-50/50">
                <CardHeader>
                  <CardTitle className="text-lg">📋 Soumettre une offre</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Intéressé par cet appel d'offres ? Soumettez votre proposition dès maintenant.
                  </p>
                  <Button 
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
                    onClick={() => setIsSubmissionOpen(true)}
                  >
                    Soumettre une offre
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Contacts (auto-gating selon Pro viewer/auteur) */}
            {(item.contact_phone || item.contact_whatsapp) && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {contentType === 'tender' ? '📞 Contact' : contentType === 'service' ? '🏛️ Contacter le service' : '📞 Contact'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ContactDisplay
                    authorId={item.author_id}
                    phone={item.contact_phone}
                    whatsapp={item.contact_whatsapp}
                    variant="card"
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <SocialShareButtons title={item.title} description={item.description || ''} />
                <FavoriteButton contentType={contentType} contentId={item.id} />
                <ReportButton contentType={contentType} contentId={item.id} />
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

      {/* Dialog de soumission d'offre */}
      {contentType === 'tender' && (
        <Dialog open={isSubmissionOpen} onOpenChange={setIsSubmissionOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
            <TenderSubmissionForm
              tenderId={item.id}
              tenderTitle={item.title}
              onClose={() => setIsSubmissionOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      <Footer />
    </div>
  );
};

export default ContentDetailPage;
