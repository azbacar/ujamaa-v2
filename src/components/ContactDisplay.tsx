import { Phone, Mail, MessageCircle, Lock, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useProStatus } from '@/hooks/useProStatus';
import { useAuthorProStatus } from '@/hooks/useAuthorProStatus';
import { useAuth } from '@/hooks/useAuth';

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
 * Règles produit (UJAMAAN — Pro = global) :
 * 1. Le viewer est Pro → voit TOUS les contacts (toujours).
 * 2. L'auteur est Pro → ses contacts sont publics pour TOUT LE MONDE.
 * 3. Sinon → masqués + CTA upgrade pour le viewer.
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
  // Règle: viewer Pro OU auteur Pro
  const canSeeContacts = viewerIsPro || !!authorIsPro;

  if (loading) {
    return <div className="h-6 w-32 bg-muted/50 rounded animate-pulse" />;
  }

  if (!canSeeContacts) {
    if (hideUpgradePrompt) return null;
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2 border border-border">
        <Lock className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="flex-1">Contacts réservés aux comptes Pro</span>
        {!user ? (
          <Link to="/auth">
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
              Se connecter
            </Button>
          </Link>
        ) : (
          <Link to="/pro">
            <Button size="sm" variant="default" className="h-7 px-2 text-xs gap-1">
              <Crown className="h-3 w-3" /> Devenir Pro
            </Button>
          </Link>
        )}
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
