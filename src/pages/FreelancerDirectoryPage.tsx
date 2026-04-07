import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FreelancerCard from '@/components/freelance/FreelancerCard';
import FreelancerProfileForm from '@/components/freelance/FreelancerProfileForm';
import { useFreelancerProfiles } from '@/hooks/useFreelancerDirectory';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, Briefcase } from 'lucide-react';
import { COMOROS_ISLANDS } from '@/hooks/useFreelance';

export default function FreelancerDirectoryPage() {
  const [search, setSearch] = useState('');
  const [island, setIsland] = useState('all');
  const { data: profiles, isLoading } = useFreelancerProfiles({ search, island: island !== 'all' ? island : undefined });
  const { user } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
      <main className="container mx-auto px-4 sm:px-6 py-8">
        {/* Hero header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
            <Briefcase className="h-4 w-4" />
            Trouvez le talent qu'il vous faut
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Répertoire Freelancers
          </h1>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            {profiles?.length ?? 0} freelancer{(profiles?.length ?? 0) > 1 ? 's' : ''} disponible{(profiles?.length ?? 0) > 1 ? 's' : ''} aux Comores
          </p>
          {user && (
            <div className="mt-4">
              <FreelancerProfileForm />
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par compétence, nom..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={island} onValueChange={setIsland}>
            <SelectTrigger className="w-full sm:w-48">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : profiles?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {profiles.map(profile => (
              <FreelancerCard key={profile.id} profile={profile} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Aucun freelancer trouvé</p>
            {user && <p className="text-sm mt-2">Soyez le premier à créer votre profil !</p>}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
