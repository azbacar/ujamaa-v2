import { ReactNode } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole, UserRole } from '@/hooks/useRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Megaphone, CheckCircle, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  allowedRoles?: UserRole[];
}

const AnnouncerRequestPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);

  const handleRequest = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('pending_modifications').insert({
        submitted_by: user.id,
        type: 'role_request',
        title: 'Demande de rôle annonceur',
        content: {
          requested_role: 'annonceur',
          user_email: user.email,
          reason: 'Souhaite publier des annonces sur la plateforme',
        },
      });
      if (error) throw error;
      setRequested(true);
      toast.success('Votre demande a été envoyée avec succès !');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Erreur lors de l'envoi de la demande");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentLanguage="fr" onLanguageChange={() => {}} />
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>

        <Card className="border-2 border-primary/20">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Megaphone className="h-8 w-8 text-primary" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Devenir Annonceur
              </h1>
              <p className="text-muted-foreground">
                Pour publier des annonces, événements, services ou appels d'offres, vous devez avoir le statut d'annonceur.
              </p>
            </div>

            <div className="text-left bg-muted/50 rounded-xl p-6 space-y-3">
              <h3 className="font-semibold text-foreground">Conditions requises :</h3>
              <ul className="space-y-2">
                {[
                  'Avoir un compte vérifié sur la plateforme',
                  'Respecter la charte de publication UJAMAA',
                  'Les publications sont soumises à modération avant diffusion',
                  'Accès au tableau de bord annonceur avec statistiques',
                ].map((condition, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {condition}
                  </li>
                ))}
              </ul>
            </div>

            {requested ? (
              <div className="bg-primary/10 rounded-xl p-4 text-primary font-medium">
                ✅ Votre demande a été envoyée ! Un administrateur l'examinera sous peu.
              </div>
            ) : (
              <Button
                onClick={handleRequest}
                disabled={loading}
                size="lg"
                className="w-full bg-gradient-to-r from-emerald-500 to-ocean-500 text-white font-semibold"
              >
                {loading ? 'Envoi en cours...' : '📝 Demander le statut annonceur'}
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  allowedRoles 
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading, hasRole } = useRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    const redirectPath = `${location.pathname}${location.search}`;
    return <Navigate to={`/auth?redirect=${encodeURIComponent(redirectPath)}`} replace />;
  }

  // Check if user has required role
  if (requiredRole && !hasRole(requiredRole)) {
    // If trying to access announcer area as regular user, show request page
    if (requiredRole === 'annonceur' || (allowedRoles && allowedRoles.includes('annonceur'))) {
      return <AnnouncerRequestPage />;
    }
    return <Navigate to="/" replace />;
  }

  // Check if user has one of the allowed roles
  if (allowedRoles && !allowedRoles.some(allowedRole => hasRole(allowedRole))) {
    // If announcer is in allowed roles, show request page for regular users
    if (allowedRoles.includes('annonceur') && role === 'user') {
      return <AnnouncerRequestPage />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
