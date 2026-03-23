import { useState } from 'react';
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
import { Briefcase } from 'lucide-react';

export default function FreelancePage() {
  const [category, setCategory] = useState('all');
  const { data: jobs, isLoading } = useFreelanceJobs(category);
  const { user } = useAuth();
  const { isAnnonceur } = useRole();
  const { currentLanguage, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
      <main className="container mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              Missions Freelance
            </h1>
            <p className="text-muted-foreground mt-1">
              {jobs?.length ?? 0} mission{(jobs?.length ?? 0) > 1 ? 's' : ''} disponible{(jobs?.length ?? 0) > 1 ? 's' : ''}
            </p>
          </div>
          {user && isAnnonceur() && <FreelanceJobForm />}
        </div>

        {/* Filters */}
        <div className="mb-6">
          <FreelanceFilters category={category} onCategoryChange={setCategory} />
        </div>

        {/* Jobs list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : jobs?.length ? (
          <div className="space-y-3">
            {jobs.map(job => (
              <FreelanceJobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Aucune mission disponible pour le moment</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
