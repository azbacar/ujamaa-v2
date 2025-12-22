import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/components/LanguageProvider';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
  const { currentLanguage, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [sessionStatus, setSessionStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');

  useEffect(() => {
    document.title = 'Réinitialiser le mot de passe | Administration';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', "Définissez un nouveau mot de passe après avoir cliqué sur le lien reçu par email.");
  }, []);

  useEffect(() => {
    let mounted = true;

    const handleRecovery = async () => {
      // Écouter les changements d'état d'authentification
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth event:', event, 'Session:', !!session);
        
        if (!mounted) return;

        if (event === 'PASSWORD_RECOVERY') {
          // L'utilisateur vient d'un lien de récupération valide
          console.log('PASSWORD_RECOVERY event detected');
          setSessionStatus('valid');
        } else if (event === 'SIGNED_IN' && session) {
          // Vérifier si c'est une session de récupération récente
          setSessionStatus('valid');
        }
      });

      // Vérifier immédiatement l'URL pour les tokens de récupération
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      const refreshToken = hashParams.get('refresh_token');

      console.log('URL params - type:', type, 'has access_token:', !!accessToken);

      if (type === 'recovery' && accessToken) {
        try {
          // Définir la session manuellement avec les tokens de l'URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (error) {
            console.error('Error setting session:', error);
            if (mounted) setSessionStatus('invalid');
          } else if (data.session) {
            console.log('Session set successfully');
            if (mounted) setSessionStatus('valid');
            // Nettoyer l'URL
            window.history.replaceState(null, '', window.location.pathname);
          }
        } catch (err) {
          console.error('Exception setting session:', err);
          if (mounted) setSessionStatus('invalid');
        }
      } else {
        // Vérifier s'il y a déjà une session active
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (mounted) setSessionStatus('valid');
        } else {
          // Attendre un peu pour les événements d'auth
          setTimeout(() => {
            if (mounted && sessionStatus === 'loading') {
              setSessionStatus('invalid');
            }
          }, 2000);
        }
      }

      return () => {
        subscription.unsubscribe();
      };
    };

    handleRecovery();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      setSuccess('Votre mot de passe a été mis à jour avec succès !');
      
      // Déconnecter et rediriger après un court délai
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/auth');
      }, 2000);
    } catch (err: any) {
      console.error('Error updating password:', err);
      setError(err.message || "Une erreur est survenue. Le lien est peut-être invalide ou expiré.");
    } finally {
      setIsLoading(false);
    }
  };

  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Vérification du lien...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
      <main className="container mx-auto px-6 py-12 flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              {sessionStatus === 'valid' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              Réinitialiser le mot de passe
            </CardTitle>
            <CardDescription>
              {sessionStatus === 'valid' 
                ? 'Choisissez un nouveau mot de passe sécurisé'
                : 'Le lien de réinitialisation est invalide ou expiré'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessionStatus === 'invalid' ? (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Ce lien de réinitialisation n'est plus valide. Il a peut-être expiré ou a déjà été utilisé.
                  </AlertDescription>
                </Alert>
                <div className="flex flex-col gap-3">
                  <Link to="/auth/forgot">
                    <Button className="w-full">
                      Demander un nouveau lien
                    </Button>
                  </Link>
                  <Link to="/auth" className="flex items-center justify-center gap-2 text-sm text-primary hover:underline">
                    <ArrowLeft className="h-4 w-4" />
                    Retour à la connexion
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Nouveau mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground">Minimum 6 caractères</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirmer le mot de passe</Label>
                    <Input
                      id="confirm"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                  </Button>
                </form>

                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="mt-4 border-green-500 bg-green-50 dark:bg-green-950">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-600">{success}</AlertDescription>
                  </Alert>
                )}

                <div className="mt-6">
                  <Link to="/auth" className="flex items-center justify-center gap-2 text-sm text-primary hover:underline">
                    <ArrowLeft className="h-4 w-4" />
                    Retour à la connexion
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPassword;
