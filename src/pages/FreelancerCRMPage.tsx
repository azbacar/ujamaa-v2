import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FreelancerCRMDashboard from '@/components/freelance/FreelancerCRMDashboard';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import { usePageSEO } from '@/hooks/usePageSEO';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Briefcase, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function FreelancerCRMPage() {
  usePageSEO({ title: 'Espace Freelancer — UJAMAA', description: 'Gérez vos clients, factures et comptabilité freelancer' });
  const { user } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [freelancerId, setFreelancerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from('freelancer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setFreelancerId(data?.id || null);
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
      <main className="container max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Espace Freelancer</h1>
            <p className="text-sm text-muted-foreground">Gestion clients, factures & comptabilité</p>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse text-center py-16 text-muted-foreground">Chargement…</div>
        ) : !user ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">Connectez-vous pour accéder à votre espace freelancer</p>
              <Button onClick={() => navigate('/auth')}>Se connecter</Button>
            </CardContent>
          </Card>
        ) : !freelancerId ? (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Créez votre profil freelancer</CardTitle>
              <CardDescription>Pour accéder au CRM, vous devez d'abord créer un profil freelancer dans le répertoire.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate('/freelancers')} className="gap-2">
                <Briefcase className="h-4 w-4" /> Aller au répertoire freelancers
              </Button>
            </CardContent>
          </Card>
        ) : (
          <FreelancerCRMDashboard freelancerId={freelancerId} />
        )}
      </main>
      <Footer />
    </div>
  );
}
