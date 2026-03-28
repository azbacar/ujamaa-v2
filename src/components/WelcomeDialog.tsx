import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User, Shield, ShieldCheck, Crown, Megaphone,
  CheckCircle, ArrowRight, Sparkles, Star
} from 'lucide-react';

const ROLE_CONFIG = {
  user: {
    label: 'Client',
    icon: User,
    color: 'bg-slate-500',
    badgeVariant: 'secondary' as const,
    description: 'Vous pouvez consulter les annonces, événements, prix et services.',
  },
  annonceur: {
    label: 'Annonceur',
    icon: Megaphone,
    color: 'bg-emerald-500',
    badgeVariant: 'default' as const,
    description: 'Vous pouvez publier des annonces, événements, services et appels d\'offres.',
  },
  moderator: {
    label: 'Modérateur',
    icon: ShieldCheck,
    color: 'bg-blue-500',
    badgeVariant: 'default' as const,
    description: 'Vous pouvez modérer le contenu et gérer les publications.',
  },
  admin: {
    label: 'Administrateur',
    icon: Shield,
    color: 'bg-red-500',
    badgeVariant: 'destructive' as const,
    description: 'Accès complet à la plateforme et au tableau de bord d\'administration.',
  },
};

const ANNONCEUR_BENEFITS = [
  'Publier des annonces et événements',
  'Accéder au tableau de bord annonceur',
  'Statistiques de performance',
  'Contact direct avec les clients',
];

const PRO_BENEFITS = [
  'Visibilité boostée par l\'IA',
  'Badge vérifié sur vos publications',
  'Prédictions de prix avancées',
  'Support prioritaire',
];

export const WelcomeDialog = () => {
  const { user, session } = useAuth();
  const { role, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || !session || roleLoading) return;

    // Only show once per session using sessionStorage
    const key = `welcome_shown_${session.access_token?.slice(-10)}`;
    if (sessionStorage.getItem(key)) return;

    // Small delay for smooth UX
    const timer = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(key, 'true');
    }, 800);

    return () => clearTimeout(timer);
  }, [user, session, roleLoading]);

  if (!user || !role) return null;

  const config = ROLE_CONFIG[role] || ROLE_CONFIG.user;
  const Icon = config.icon;
  const isRegularUser = role === 'user';
  const isNotPro = role === 'user' || role === 'annonceur';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-3">
          <div className={`w-14 h-14 mx-auto rounded-full ${config.color} flex items-center justify-center text-white`}>
            <Icon className="h-7 w-7" />
          </div>
          <DialogTitle className="text-xl">
            Bienvenue sur UJAMAA !
          </DialogTitle>
          <DialogDescription className="flex flex-col items-center gap-2">
            <Badge variant={config.badgeVariant} className="text-sm px-3 py-1">
              {config.label}
            </Badge>
            <span className="text-muted-foreground text-sm mt-1">{config.description}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Upgrade to Annonceur for regular users */}
          {isRegularUser && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-emerald-600" />
                <h4 className="font-semibold text-sm text-foreground">Devenez Annonceur</h4>
              </div>
              <ul className="space-y-1.5">
                {ANNONCEUR_BENEFITS.map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              <Button
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => { setOpen(false); navigate('/annonceur'); }}
              >
                Demander le statut annonceur <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Upgrade to Pro for users & annonceurs */}
          {isNotPro && (
            <>
              {isRegularUser && <Separator />}
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-600" />
                  <h4 className="font-semibold text-sm text-foreground">Passez au compte Pro</h4>
                  <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700">
                    <Sparkles className="h-3 w-3 mr-1" /> Premium
                  </Badge>
                </div>
                <ul className="space-y-1.5">
                  {PRO_BENEFITS.map((b, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-amber-400 text-amber-700 hover:bg-amber-50"
                  onClick={() => { setOpen(false); navigate('/pro'); }}
                >
                  Découvrir les offres Pro <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          )}

          {/* Admin/Mod quick access */}
          {(role === 'admin' || role === 'moderator') && (
            <Button
              className="w-full"
              onClick={() => { setOpen(false); navigate('/admin'); }}
            >
              Accéder au tableau de bord <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}

          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => setOpen(false)}
          >
            Continuer la navigation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
