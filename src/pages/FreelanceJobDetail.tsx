import { useParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MapPin, Wifi, Calendar, Banknote, User, Eye, LogIn } from 'lucide-react';
import { useFreelanceJob, useJobReviews, FREELANCE_CATEGORIES } from '@/hooks/useFreelance';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import FreelanceJobForm from '@/components/freelance/FreelanceJobForm';
import FreelanceProposalForm from '@/components/freelance/FreelanceProposalForm';
import FreelanceProposalList from '@/components/freelance/FreelanceProposalList';
import FreelanceReviewCard from '@/components/freelance/FreelanceReviewCard';
import SocialShareButtons from '@/components/SocialShareButtons';
import { usePageSEO } from '@/hooks/usePageSEO';

export default function FreelanceJobDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading } = useFreelanceJob(id!);
  const { data: reviews } = useJobReviews(id!);
  const { user } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();

  usePageSEO({
    title: job?.title || 'Mission Freelance',
    description: job?.description?.substring(0, 160) || 'Détail d\'une mission freelance aux Comores',
    canonicalPath: id ? `/freelance/${id}` : undefined,
    ogType: 'article',
    keywords: job ? `${job.category}, freelance, mission, comores` : undefined,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
        <main className="container mx-auto px-4 py-8">
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </main>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background">
        <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
        <main className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground mb-4">Mission introuvable</p>
          <Link to="/freelance"><Button variant="outline">Retour aux missions</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  const categoryLabel = FREELANCE_CATEGORIES.find(c => c.value === job.category)?.label || job.category;
  const isAuthor = user?.id === job.author_id;

  const formatBudget = () => {
    if (job.budget_min && job.budget_max) {
      return `${job.budget_min.toLocaleString()} - ${job.budget_max.toLocaleString()} ${job.currency}`;
    }
    if (job.budget_min) return `À partir de ${job.budget_min.toLocaleString()} ${job.currency}`;
    if (job.budget_max) return `Jusqu'à ${job.budget_max.toLocaleString()} ${job.currency}`;
    return 'Budget à discuter';
  };

  const statusLabel: Record<string, string> = {
    draft: '🟡 Brouillon',
    published: '🟢 Publié',
    closed: '🔴 Clôturé',
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
      <main className="container mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Link to="/freelance" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Retour aux missions
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h1 className="text-xl font-bold text-foreground">{job.title}</h1>
                    {isAuthor && (
                      <span className="text-xs text-muted-foreground">{statusLabel[job.status] || job.status}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{categoryLabel}</Badge>
                    {isAuthor && <FreelanceJobForm editJob={job} />}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="h-4 w-4" />{job.author_username}</span>
                  {job.island && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.island}{job.location && ` · ${job.location}`}</span>}
                  {job.is_remote && <span className="flex items-center gap-1"><Wifi className="h-4 w-4" />À distance</span>}
                  <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{job.views} vue{job.views !== 1 ? 's' : ''}</span>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 font-semibold text-primary">
                    <Banknote className="h-4 w-4" />{formatBudget()}
                  </span>
                  {job.deadline && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Avant le {new Date(job.deadline).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>

                {job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {job.skills.map(skill => (
                      <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                )}

                <div className="pt-3 border-t border-border">
                  <p className="text-sm text-foreground whitespace-pre-line">{job.description}</p>
                </div>

                <p className="text-xs text-muted-foreground">
                  Publié le {new Date(job.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>

                <div className="pt-3 border-t border-border">
                  <SocialShareButtons title={job.title} description={job.description} />
                </div>
              </CardContent>
            </Card>

            {/* Proposals — visible to job author only */}
            {isAuthor && <FreelanceProposalList jobId={job.id} />}

            {/* Reviews */}
            {reviews && reviews.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">Avis</h2>
                {reviews.map(review => (
                  <FreelanceReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {!isAuthor && user && <FreelanceProposalForm jobId={job.id} />}
            {!user && (
              <Card>
                <CardContent className="p-4 text-center text-sm text-muted-foreground space-y-3">
                  <p>Connectez-vous pour postuler à cette mission</p>
                  <Link to={`/auth?redirect=${encodeURIComponent(`/freelance/${job.id}`)}`}>
                    <Button className="w-full gap-2">
                      <LogIn className="h-4 w-4" /> Se connecter pour postuler
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
