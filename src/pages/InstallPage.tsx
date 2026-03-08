import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Monitor, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPage = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <Button variant="ghost" size="sm" className="absolute left-4 top-4" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <div className="mx-auto mb-4">
            <img src="/pwa-192x192.png" alt="Ujamaan" className="w-20 h-20 rounded-2xl mx-auto" />
          </div>
          <CardTitle className="text-2xl">Installer Ujamaan</CardTitle>
          <CardDescription>
            Accédez à Ujamaan directement depuis votre écran d'accueil, même hors connexion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-3">
              <CheckCircle className="h-12 w-12 text-secondary mx-auto" />
              <p className="text-lg font-medium text-foreground">Application déjà installée !</p>
              <p className="text-sm text-muted-foreground">Ujamaan est accessible depuis votre écran d'accueil.</p>
            </div>
          ) : deferredPrompt ? (
            <Button onClick={handleInstall} size="lg" className="w-full gap-2">
              <Download className="h-5 w-5" /> Installer l'application
            </Button>
          ) : isIOS ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Pour installer sur iPhone/iPad :</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Appuyez sur le bouton <strong>Partager</strong> (icône ↑) en bas de Safari</li>
                <li>Faites défiler et appuyez sur <strong>"Sur l'écran d'accueil"</strong></li>
                <li>Appuyez sur <strong>Ajouter</strong></li>
              </ol>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Pour installer :</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Ouvrez le menu de votre navigateur (⋮ ou ⋯)</li>
                <li>Sélectionnez <strong>"Installer l'application"</strong> ou <strong>"Ajouter à l'écran d'accueil"</strong></li>
              </ol>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Smartphone className="h-4 w-4 shrink-0" />
              <span>Mobile & Tablette</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Monitor className="h-4 w-4 shrink-0" />
              <span>PC & Mac</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallPage;
