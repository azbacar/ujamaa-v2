/**
 * Helpers centralisés pour les CTA "Se connecter" et "Devenir Pro".
 * Garantit que :
 *  - Tous les liens vers /auth incluent ?redirect=<page courante>
 *  - Tous les liens vers /pro incluent ?redirect=<page courante>
 *  - Après login, useAuthRedirect ramène l'utilisateur exactement là d'où il vient.
 *
 * Usage :
 *   import { authPath, proPath } from '@/lib/authRedirect';
 *   <Link to={authPath()}>Se connecter</Link>
 *   <Link to={proPath()}>Devenir Pro</Link>
 */

/** Capture le chemin courant (path + search + hash) pour le passer en redirect. */
function getCurrentPath(): string {
  if (typeof window === 'undefined') return '/';
  const { pathname, search, hash } = window.location;
  const full = `${pathname}${search}${hash}`;
  // Évite les boucles : si on est déjà sur /auth ou /pro on rebascule à l'accueil
  if (pathname.startsWith('/auth') || pathname.startsWith('/pro')) return '/';
  return full || '/';
}

/** Construit l'URL /auth?redirect=... avec la page courante. */
export function authPath(redirectTo?: string): string {
  const target = redirectTo || getCurrentPath();
  return `/auth?redirect=${encodeURIComponent(target)}`;
}

/** Construit l'URL /pro?redirect=... avec la page courante (utile si on revient ensuite). */
export function proPath(redirectTo?: string): string {
  const target = redirectTo || getCurrentPath();
  return `/pro?redirect=${encodeURIComponent(target)}`;
}

/** Libellés standards pour cohérence UI. */
export const CTA_LABELS = {
  login: 'Se connecter',
  loginToContact: 'Se connecter pour contacter',
  loginShort: 'Connexion',
  becomePro: 'Devenir Pro',
  upgradeToPro: 'Passer Pro',
} as const;
