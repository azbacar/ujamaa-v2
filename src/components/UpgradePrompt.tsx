import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Megaphone, CheckCircle, ArrowRight, LogIn, Crown, Sparkles, Users } from 'lucide-react';

interface UpgradePromptProps {
  /** What action the user tried to perform */
  action?: string;
  /** Show a compact version */
  compact?: boolean;
}

const CONDITIONS = [
  'Avoir un compte vérifié sur la plateforme',
  'Respecter la charte de publication UJAMAA',
  'Les publications sont soumises à modération',
  'Accès au tableau de bord avec statistiques',
];

export const UpgradePrompt = ({ action = 'publier du contenu', compact = false }: UpgradePromptProps) => {
  const { user } = useAuth();
  const { role } = useRole();
  const navigate = useNavigate();
  const [annonceurCount, setAnnonceurCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'annonceur')
      .then(({ count }) => setAnnonceurCount(count ?? 0));
  }, []);

  // Not logged in
  if (!user) {
    return (
      <Card className="border-2 border-primary/20">
        <CardContent className={`${compact ? 'p-4' : 'p-6'} text-center space-y-4`}>
          <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <LogIn className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Connexion requise</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Connectez-vous pour {action}.
            </p>
          </div>
          <Button onClick={() => navigate('/auth')} className="w-full">
            Se connecter <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Regular user trying to access announcer features
  if (role === 'user') {
    return (
      <Card className="border-2 border-emerald-200 dark:border-emerald-800">
        <CardContent className={`${compact ? 'p-4' : 'p-6'} space-y-4`}>
          <div className="text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Megaphone className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">Compte Annonceur requis</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Pour {action}, vous devez avoir le statut d'annonceur.
              </p>
            </div>
            <Badge variant="secondary" className="mx-auto">
              Votre compte : Client
            </Badge>
          </div>

          {!compact && (
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <h4 className="font-medium text-sm text-foreground">Avantages du compte Annonceur :</h4>
              <ul className="space-y-1.5">
                {CONDITIONS.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {annonceurCount !== null && annonceurCount > 0 && (
            <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-primary/5 border border-primary/10">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {annonceurCount} annonceur{annonceurCount > 1 ? 's' : ''} actif{annonceurCount > 1 ? 's' : ''}
              </span>
              <span className="text-xs text-muted-foreground">utilisent déjà la plateforme</span>
            </div>
          )}
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => navigate('/annonceur')}
            >
              📝 Demander le statut annonceur <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
              onClick={() => navigate('/pro')}
            >
              <Crown className="h-4 w-4 mr-1" />
              <Sparkles className="h-3 w-3 mr-1" />
              Ou passez directement au Pro
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};
