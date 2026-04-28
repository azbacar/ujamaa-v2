import { useParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useDiasporaProject, useProjectInvestments, useProjectUpdates, useUpdateInvestmentStatus } from '@/hooks/useDiaspora';
import InvestmentForm from '@/components/diaspora/InvestmentForm';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import ContactDisplay from '@/components/ContactDisplay';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MapPin, Calendar, Mail, Phone, TrendingUp, Clock, CheckCircle, XCircle, BadgeCheck, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { usePageSEO } from '@/hooks/usePageSEO';
import { useViewTracker } from '@/hooks/useViewTracker';

export default function DiasporaProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: project, isLoading } = useDiasporaProject(id);
  const [isAuthorPro, setIsAuthorPro] = useState(false);

  useEffect(() => {
    if (!project?.author_id) return;
    supabase.from('users').select('account_type').eq('id', project.author_id).maybeSingle()
      .then(({ data }) => setIsAuthorPro(data?.account_type === 'pro' || data?.account_type === 'enterprise'));
  }, [project?.author_id]);
  const { data: investments } = useProjectInvestments(id);
  const { data: updates } = useProjectUpdates(id);
  const updateStatus = useUpdateInvestmentStatus();

  usePageSEO({
    title: project?.title || 'Projet Diaspora',
    description: project?.description?.substring(0, 160) || 'Projet d\'investissement diaspora aux Comores',
    canonicalPath: id ? `/investissement/${id}` : undefined,
    ogType: 'article',
    keywords: project ? `${project.category}, investissement, diaspora, comores` : undefined,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header currentLanguage="fr" onLanguageChange={() => {}} />
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Header currentLanguage="fr" onLanguageChange={() => {}} />
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold">Projet introuvable</h2>
          <Button asChild className="mt-4"><Link to="/investissement">Retour</Link></Button>
        </div>
      </div>
    );
  }

  const progress = project.target_amount > 0
    ? Math.min((project.current_amount / project.target_amount) * 100, 100)
    : 0;

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('fr-FR').format(amount) + ' ' + project.currency;

  const isAuthor = user?.id === project.author_id;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-background">
      <Header currentLanguage="fr" onLanguageChange={() => {}} />

      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/investissement"><ArrowLeft className="h-4 w-4 mr-2" /> Retour</Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {project.images?.[0] && (
              <img src={project.images[0]} alt={project.title} className="w-full rounded-xl max-h-96 object-cover" />
            )}

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{project.category}</Badge>
                {project.is_carrier_verified && (
                  <Badge className="bg-blue-100 text-blue-700 text-xs gap-1">
                    <BadgeCheck className="h-3 w-3" /> Porteur vérifié
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">{project.title}</h1>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                {project.island && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {project.island}</span>}
                {project.location && <span>{project.location}</span>}
                {project.deadline && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> Échéance : {new Date(project.deadline).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
            </div>

            <Card>
              <CardContent className="pt-6 prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{project.full_content || project.description}</p>
              </CardContent>
            </Card>

            {/* Contact (auto-gating Pro) */}
            {(project.contact_email || project.contact_phone) && (
              <Card>
                <CardHeader><CardTitle className="text-base">📞 Contact</CardTitle></CardHeader>
                <CardContent>
                  <ContactDisplay
                    authorId={project.author_id}
                    phone={project.contact_phone}
                    email={project.contact_email}
                    variant="card"
                  />
                </CardContent>
              </Card>
            )}

            {/* Updates */}
            {updates && updates.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">📢 Mises à jour</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {updates.map(u => (
                    <div key={u.id} className="border-l-2 border-emerald-400 pl-4">
                      <h4 className="font-medium">{u.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{u.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(u.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Author: investments received */}
            {isAuthor && investments && investments.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">💼 Investissements reçus ({investments.length})</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {investments.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                      <div>
                        <p className="font-medium">{formatAmount(inv.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {inv.payment_method} · {new Date(inv.created_at).toLocaleDateString('fr-FR')}
                        </p>
                        {inv.message && <p className="text-sm mt-1 italic">"{inv.message}"</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {inv.status === 'pending' ? (
                          <>
                            <Button size="sm" variant="outline" className="text-green-600 border-green-200"
                              onClick={() => updateStatus.mutate({ id: inv.id, status: 'confirmed' })}>
                              <CheckCircle className="h-4 w-4 mr-1" /> Accepter
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200"
                              onClick={() => updateStatus.mutate({ id: inv.id, status: 'cancelled' })}>
                              <XCircle className="h-4 w-4 mr-1" /> Refuser
                            </Button>
                          </>
                        ) : (
                          <Badge variant={inv.status === 'confirmed' ? 'default' : 'destructive'}>
                            {inv.status === 'confirmed' ? '✅ Confirmé' : '❌ Refusé'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1 font-semibold text-emerald-600">
                      <TrendingUp className="h-4 w-4" />
                      {formatAmount(project.current_amount)}
                    </span>
                    <span className="text-muted-foreground">/ {formatAmount(project.target_amount)}</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <p className="text-sm text-center text-muted-foreground">{Math.round(progress)}% financé</p>
                </div>

                <Separator />

                {project.min_investment && project.min_investment > 0 && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Investissement min :</span>
                    <span className="font-medium ml-1">{formatAmount(project.min_investment)}</span>
                  </div>
                )}

                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Publié le {new Date(project.created_at).toLocaleDateString('fr-FR')}
                </div>
              </CardContent>
            </Card>

            {/* Chat interne pour les porteurs Pro */}
            {isAuthorPro && !isAuthor && (
              <Card>
                <CardContent className="pt-6">
                  <Button 
                    className="w-full"
                    onClick={() => {
                      if (!user) { navigate('/auth'); return; }
                      navigate(`/messages/${project.author_id}`);
                    }}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Contacter le porteur
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Investment form - only if not author and logged in */}
            {user && !isAuthor && (
              <InvestmentForm project={project} />
            )}

            {!user && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-3">Connectez-vous pour investir</p>
                  <Button asChild className="w-full"><Link to="/auth">Se connecter</Link></Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
