import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MapPin, Wifi, Calendar, Banknote, User, Eye } from 'lucide-react';
import { useFreelanceJob, useJobReviews, FREELANCE_CATEGORIES } from '@/hooks/useFreelance';
import { useAuth } from '@/hooks/useAuth';
import FreelanceProposalForm from '@/components/freelance/FreelanceProposalForm';
import FreelanceProposalList from '@/components/freelance/FreelanceProposalList';
import FreelanceReviewCard from '@/components/freelance/FreelanceReviewCard';

export default function FreelanceJobDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading } = useFreelanceJob(id!);
  const { data: reviews } = useJobReviews(id!);
  const { user } = useAuth();

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
          </div>
        </main>
      </>
    );
  }

  if (!job) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Mission introuvable</p>
            <Link to="/freelance"><Button variant="outline">Retour aux missions</Button></Link>
          </div>
        </main>
        <Footer />
      </>
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

  return (
    <>
      <Helmet>
        <title>{job.title} — Freelance | Ujamaan</title>
        <meta name="description" content={job.description.slice(0, 160)} />
      </Helmet>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
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
                    <h1 className="text-xl font-bold text-foreground">{job.title}</h1>
                    <Badge variant="secondary">{categoryLabel}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="h-4 w-4" />{job.author_username}</span>
                    {job.island && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.island}{job.location && ` · ${job.location}`}</span>}
                    {job.is_remote && <span className="flex items-center gap-1"><Wifi className="h-4 w-4" />Remote</span>}
                    <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{job.views} vues</span>
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
              {!isAuthor && <FreelanceProposalForm jobId={job.id} />}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
