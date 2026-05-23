import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FreelancerCard from '@/components/freelance/FreelancerCard';
import FreelancerProfileForm from '@/components/freelance/FreelancerProfileForm';
import { useFreelancerProfiles } from '@/hooks/useFreelancerDirectory';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import { usePageSEO } from '@/hooks/usePageSEO';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, Briefcase, BarChart3, Sparkles } from 'lucide-react';
import { COMOROS_ISLANDS } from '@/hooks/useFreelance';

export default function FreelancerDirectoryPage() {
  const [search, setSearch] = useState('');
  const [island, setIsland] = useState('all');
  const { data: profiles, isLoading } = useFreelancerProfiles({ search, island: island !== 'all' ? island : undefined });
  const { user } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();
  const navigate = useNavigate();

  usePageSEO({
    title: 'Répertoire Freelancers',
    description: 'Trouvez des freelancers qualifiés aux Comores : développeurs, designers, traducteurs, photographes et plus.',
    canonicalPath: '/freelancers',
    keywords: 'freelance Comores, freelancers, talents, indépendants, services',
  });

  const total = profiles?.length ?? 0;
  const proCount = profiles?.filter(p => p.account_type === 'pro').length ?? 0;
  const islandsCount = new Set(profiles?.map(p => p.island).filter(Boolean)).size;

  return (
    <div className="min-h-screen bg-background">
      <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-emerald-500/5">
          <div className="absolute inset-0 pointer-events-none [background:radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.18),transparent_55%),radial-gradient(circle_at_80%_80%,hsl(var(--primary)/0.12),transparent_55%)]" />
          <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-14 relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-4 backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Trouvez le talent qu'il vous faut
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight">
                Répertoire{' '}
                <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                  Freelancers
                </span>
              </h1>
              <p className="text-muted-foreground mt-3 sm:mt-4 text-sm sm:text-base max-w-xl mx-auto">
                Découvrez les professionnels indépendants des Comores et collaborez en toute confiance.
              </p>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-6 max-w-md mx-auto">
                {[
                  { label: 'Freelancers', value: total },
                  { label: 'Pro vérifiés', value: proCount },
                  { label: 'Îles couvertes', value: islandsCount },
                ].map(s => (
                  <div key={s.label} className="rounded-xl bg-card/70 backdrop-blur border border-border px-3 py-2.5">
                    <div className="text-xl sm:text-2xl font-bold text-foreground">{s.value}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">{s.label}</div>
                  </div>
                ))}
              </div>

              {user && (
                <div className="mt-6 flex gap-3 justify-center flex-wrap">
                  <FreelancerProfileForm />
                  <Button variant="outline" className="gap-2" onClick={() => navigate('/freelancer-crm')}>
                    <BarChart3 className="h-4 w-4" /> Mon CRM Freelancer
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 sm:px-6 py-8">
          {/* Filters bar (floating over hero) */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-2xl mx-auto -mt-14 sm:-mt-16 relative z-10 bg-card/95 backdrop-blur border border-border rounded-2xl p-3 shadow-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par compétence, nom..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 border-0 bg-muted/50 focus-visible:ring-1"
              />
            </div>
            <Select value={island} onValueChange={setIsland}>
              <SelectTrigger className="w-full sm:w-48 border-0 bg-muted/50">
                <SelectValue placeholder="Toutes les îles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les îles</SelectItem>
                {COMOROS_ISLANDS.map(i => (
                  <SelectItem key={i} value={i}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : profiles?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
              {profiles.map(profile => (
                <FreelancerCard key={profile.id} profile={profile} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground max-w-md mx-auto">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <p className="font-medium text-foreground">Aucun freelancer trouvé</p>
              <p className="text-sm mt-1">Affinez votre recherche ou changez d'île.</p>
              {user && <p className="text-sm mt-3">💡 Soyez le premier à créer votre profil !</p>}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
