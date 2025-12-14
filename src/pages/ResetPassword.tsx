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
import { ArrowLeft } from 'lucide-react';

const ResetPassword = () => {
  const { currentLanguage, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    document.title = 'Réinitialiser le mot de passe | Administration';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', "Définissez un nouveau mot de passe après avoir cliqué sur le lien reçu par email.");
  }, []);

  // Vérifier si l'utilisateur vient d'un lien de reset (pas d'une session normale)
  useEffect(() => {
    const checkResetSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Vérifier si c'est une session de récupération (recovery)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      const accessToken = hashParams.get('access_token');
      
      if (type === 'recovery' && accessToken) {
        // L'utilisateur vient d'un lien de reset valide
        setIsValidSession(true);
      } else if (session) {
        // Session normale mais pas de recovery - vérifier si c'était un recovery récent
        // On accepte la session car Supabase a déjà traité le token
        setIsValidSession(true);
      } else {
        setIsValidSession(false);
      }
    };
    
    checkResetSession();
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
      
      // Déconnecter l'utilisateur après le changement de mot de passe
      await supabase.auth.signOut();
      
      setSuccess('Votre mot de passe a été mis à jour. Vous allez être redirigé vers la page de connexion.');
      setTimeout(() => navigate('/auth'), 2000);
    } catch (err: any) {
      setError(err.message || "Le lien est invalide ou a expiré. Veuillez refaire la procédure.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
      <main className="container mx-auto px-6 py-12 flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Réinitialiser le mot de passe</CardTitle>
            <CardDescription>Choisissez un nouveau mot de passe sécurisé</CardDescription>
          </CardHeader>
          <CardContent>
            {!isValidSession && (
              <Alert className="mb-4">
                <AlertDescription>
                  Le lien de réinitialisation est invalide ou expiré. Veuillez refaire la demande.
                </AlertDescription>
              </Alert>
            )}
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
                  disabled={!isValidSession}
                />
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
                  disabled={!isValidSession}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || !isValidSession}>
                {isLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
              </Button>
            </form>

            {error && (
              <Alert className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mt-4">
                <AlertDescription className="text-green-600">{success}</AlertDescription>
              </Alert>
            )}

            <div className="mt-6 flex flex-col gap-3">
              <Link to="/auth" className="flex items-center justify-center gap-2 text-sm text-primary hover:underline">
                <ArrowLeft className="h-4 w-4" />
                Retour à la connexion
              </Link>
              {!isValidSession && (
                <Link to="/auth/forgot" className="text-sm text-muted-foreground hover:underline text-center">
                  Demander un nouveau lien
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPassword;
