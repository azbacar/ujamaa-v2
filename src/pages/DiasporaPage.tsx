import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useDiasporaProjects } from '@/hooks/useDiaspora';
import DiasporaProjectCard from '@/components/diaspora/DiasporaProjectCard';
import DiasporaProjectForm from '@/components/diaspora/DiasporaProjectForm';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, TrendingUp, Globe } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const categories = [
  { value: 'all', label: 'Toutes catégories' },
  { value: 'agriculture', label: '🌾 Agriculture' },
  { value: 'immobilier', label: '🏠 Immobilier' },
  { value: 'commerce', label: '🏪 Commerce' },
  { value: 'technologie', label: '💻 Technologie' },
  { value: 'education', label: '📚 Éducation' },
  { value: 'sante', label: '🏥 Santé' },
  { value: 'energie', label: '⚡ Énergie' },
  { value: 'tourisme', label: '🏖️ Tourisme' },
  { value: 'artisanat', label: '🎨 Artisanat' },
  { value: 'autre', label: '📦 Autre' },
];

const islands = [
  { value: 'all', label: 'Toutes les îles' },
  { value: 'Grande Comore', label: 'Grande Comore' },
  { value: 'Anjouan', label: 'Anjouan' },
  { value: 'Mohéli', label: 'Mohéli' },
  { value: 'Mayotte', label: 'Mayotte' },
];

export default function DiasporaPage() {
  const { user } = useAuth();
  const [category, setCategory] = useState('all');
  const [island, setIsland] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: projects, isLoading } = useDiasporaProjects({
    category: category !== 'all' ? category : undefined,
    island: island !== 'all' ? island : undefined,
  });

  const filtered = projects?.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-background">
      <Header currentLanguage="fr" onLanguageChange={() => {}} />

      {/* Hero */}
      <section className="relative py-12 sm:py-16 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Globe className="h-8 w-8" />
            <h1 className="text-3xl sm:text-4xl font-bold">Investissement Diaspora</h1>
          </div>
          <p className="text-lg text-emerald-100 max-w-2xl mx-auto">
            Investissez dans des projets locaux depuis l'étranger. Contribuez au développement des Comores.
          </p>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <span>{projects?.length || 0} projets actifs</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="explore">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="explore">🔍 Explorer</TabsTrigger>
              {user && <TabsTrigger value="submit">➕ Soumettre</TabsTrigger>}
            </TabsList>
          </div>

          <TabsContent value="explore">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un projet..."
                  className="pl-9"
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Catégorie" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={island} onValueChange={setIsland}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Île" /></SelectTrigger>
                <SelectContent>
                  {islands.map(i => (
                    <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-80 rounded-xl" />
                ))}
              </div>
            ) : filtered && filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(project => (
                  <DiasporaProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Globe className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">Aucun projet trouvé</h3>
                <p className="text-sm text-muted-foreground mt-1">Soyez le premier à soumettre un projet !</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="submit">
            {user ? (
              <div className="max-w-2xl mx-auto">
                <DiasporaProjectForm onSuccess={() => {}} />
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">Connectez-vous pour soumettre un projet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
