import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FreelanceJobCard from '@/components/freelance/FreelanceJobCard';
import FreelanceJobForm from '@/components/freelance/FreelanceJobForm';
import FreelanceFilters from '@/components/freelance/FreelanceFilters';
import { useFreelanceJobs } from '@/hooks/useFreelance';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useLanguage } from '@/components/LanguageProvider';
import { usePageSEO } from '@/hooks/usePageSEO';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, Sparkles } from 'lucide-react';

export default function FreelancePage() {
  const [category, setCategory] = useState('all');
  usePageSEO({
    title: 'Missions Freelance',
    description: 'Trouvez des missions freelance aux Comores ou proposez vos services professionnels.',
    canonicalPath: '/freelance',
    keywords: 'freelance Comores, missions, travail, services professionnels',
  });
  const { data: jobs, isLoading } = useFreelanceJobs(category);
  const { user } = useAuth();
  const { isAnnonceur } = useRole();
  const { currentLanguage, setLanguage } = useLanguage();

  const total = jobs?.length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-emerald-500/5">
          <div className="absolute inset-0 pointer-events-none [background:radial-gradient(circle_at_15%_30%,hsl(var(--primary)/0.18),transparent_55%),radial-gradient(circle_at_85%_70%,hsl(var(--primary)/0.12),transparent_55%)]" />
          <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-14 relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-4 backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Opportunités professionnelles
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight">
                Missions{' '}
                <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                  Freelance
                </span>
              </h1>
              <p className="text-muted-foreground mt-3 sm:mt-4 text-sm sm:text-base max-w-xl mx-auto">
                {total} mission{total > 1 ? 's' : ''} disponible{total > 1 ? 's' : ''} aux Comores.
                Postulez ou publiez la vôtre.
              </p>

              <div className="mt-6 flex gap-3 justify-center flex-wrap">
                {user && isAnnonceur() && <FreelanceJobForm />}
                <Link to="/freelancers">
                  <Button variant="outline" className="gap-2">
                    <Users className="h-4 w-4" /> Voir les freelancers
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
          {/* Filters */}
          <div className="mb-6 -mt-14 sm:-mt-16 relative z-10 bg-card/95 backdrop-blur border border-border rounded-2xl p-3 shadow-lg">
            <FreelanceFilters category={category} onCategoryChange={setCategory} />
          </div>

          {/* Jobs list */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : jobs?.length ? (
            <div className="space-y-3">
              {jobs.map(job => (
                <FreelanceJobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground max-w-md mx-auto">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
              <p className="font-medium text-foreground">Aucune mission disponible</p>
              <p className="text-sm mt-1">Revenez bientôt ou explorez les freelancers disponibles.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
