import { Phone, Mail, MessageCircle, Lock, Crown, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useProStatus } from '@/hooks/useProStatus';
import { useAuthorProStatus } from '@/hooks/useAuthorProStatus';
import { useAuth } from '@/hooks/useAuth';
import { authPath, proPath, CTA_LABELS } from '@/lib/authRedirect';

interface ContactDisplayProps {
  /** ID de l'auteur de la publication (clé pour savoir si c'est un Pro) */
  authorId?: string | null;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  /** Variante d'affichage */
  variant?: 'inline' | 'card' | 'compact';
  /** Masque le CTA upgrade quand le viewer ne peut pas voir */
  hideUpgradePrompt?: boolean;
}

/**
 * Affichage centralisé des contacts d'une publication.
 *
 * Règles produit (UJAMAAN — règle unifiée) :
 * 1. Visiteur non connecté → TOUJOURS masqué + CTA "Se connecter pour contacter".
 * 2. Connecté + (viewer Pro OU auteur Pro) → contacts visibles.
 * 3. Connecté non-Pro + auteur non-Pro → masqué + CTA "Devenir Pro".
 *
 * Le statut "Vérifié" n'a AUCUN impact ici (uniquement géoloc publique).
 */
export default function ContactDisplay({
  authorId,
  phone,
  email,
  whatsapp,
  variant = 'inline',
  hideUpgradePrompt = false,
}: ContactDisplayProps) {
  const { user } = useAuth();
  const { isPro: viewerIsPro, loading: viewerLoading } = useProStatus();
  const { data: authorIsPro, isLoading: authorLoading } = useAuthorProStatus(authorId);

  const hasAnyContact = !!(phone || email || whatsapp);
  if (!hasAnyContact) return null;

  const loading = viewerLoading || authorLoading;
  // Règle stricte : doit être connecté ET (viewer Pro OU auteur Pro)
  const canSeeContacts = !!user && (viewerIsPro || !!authorIsPro);

  if (loading) {
    return <div className="h-6 w-32 bg-muted/50 rounded animate-pulse" />;
  }

  if (!canSeeContacts) {
    if (hideUpgradePrompt) return null;

    // Cas 1 : visiteur non connecté
    if (!user) {
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2 border border-border">
          <Lock className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="flex-1">Connectez-vous pour contacter cet annonceur</span>
          <Link to={authPath()}>
            <Button size="sm" variant="default" className="h-7 px-2 text-xs gap-1">
              <LogIn className="h-3 w-3" /> {CTA_LABELS.login}
            </Button>
          </Link>
        </div>
      );
    }

    // Cas 2 : connecté mais non-Pro et auteur non-Pro
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2 border border-border">
        <Lock className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="flex-1">Devenez Pro pour voir les contacts</span>
        <Link to="/pro">
          <Button size="sm" variant="default" className="h-7 px-2 text-xs gap-1">
            <Crown className="h-3 w-3" /> Devenir Pro
          </Button>
        </Link>
      </div>
    );
  }

  // Affichage des contacts visibles
  const containerClass =
    variant === 'card'
      ? 'flex flex-col gap-2'
      : variant === 'compact'
      ? 'flex flex-wrap gap-1'
      : 'flex flex-wrap gap-2';

  return (
    <div className={containerClass}>
      {phone && (
        <a
          href={`tel:${phone}`}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-md transition-colors"
        >
          <Phone className="h-3.5 w-3.5" />
          <span className="truncate max-w-[140px]">{phone}</span>
        </a>
      )}
      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp.replace(/[^\d]/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-md transition-colors"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span className="truncate max-w-[140px]">WhatsApp</span>
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1.5 rounded-md transition-colors"
        >
          <Mail className="h-3.5 w-3.5" />
          <span className="truncate max-w-[180px]">{email}</span>
        </a>
      )}
    </div>
  );
}
