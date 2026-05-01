import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Radio, MessageCircle, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVendorLocation } from '@/hooks/useVendorLocation';
import { cn } from '@/lib/utils';

/**
 * Barre flottante globale visible sur toute l'app quand un partage
 * de position (fixe ou ambulant) est actif. Permet au vendeur de
 * naviguer librement (messages, autres pages, autres apps) sans perdre
 * de vue son partage en cours.
 */
const formatRemaining = (target: Date) => {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return '0 min';
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m} min`;
};

export const ActiveShareBar = () => {
  const { isActive, isMobileActive, expiresAt, stopSharing } = useVendorLocation();
  const location = useLocation();
  const [, force] = useState(0);

  // Re-render every 30s to refresh the countdown
  useEffect(() => {
    if (!isActive) return;
    const t = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, [isActive]);

  // Hide on the auth page to avoid covering critical UI
  if (!isActive || !expiresAt) return null;
  if (location.pathname.startsWith('/auth')) return null;

  const remaining = formatRemaining(expiresAt);
  const expired = expiresAt.getTime() <= Date.now();

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed left-1/2 -translate-x-1/2 z-[60]',
        'bottom-3 sm:bottom-4',
        'w-[min(96vw,640px)]',
        'rounded-2xl shadow-2xl border border-emerald-200/70',
        'bg-gradient-to-r from-emerald-600 to-teal-600 text-white',
        'animate-fade-in'
      )}
    >
      <div className="flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-2.5">
        <span className="relative flex h-3 w-3 shrink-0">
          {isMobileActive && !expired && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          )}
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold leading-tight">
            {isMobileActive ? (
              <Radio className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <MapPin className="h-3.5 w-3.5 shrink-0" />
            )}
            <span className="truncate">
              {isMobileActive ? 'Partage ambulant actif' : 'Position fixe partagée'}
            </span>
          </div>
          <div className="text-[11px] sm:text-xs opacity-90 leading-tight">
            Expire dans <strong className="font-semibold">{remaining}</strong>
            {isMobileActive && (
              <span className="hidden sm:inline"> · Gardez l'onglet ouvert</span>
            )}
          </div>
        </div>

        <Button
          asChild
          size="sm"
          variant="secondary"
          className="h-8 px-2.5 sm:px-3 bg-white/95 text-emerald-700 hover:bg-white shrink-0"
        >
          <Link to="/messages" aria-label="Voir mes messages">
            <MessageCircle className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Messages</span>
          </Link>
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            if (window.confirm('Arrêter le partage de votre position ?')) {
              stopSharing();
            }
          }}
          aria-label="Arrêter le partage"
          className="h-8 w-8 shrink-0 text-white hover:bg-white/15"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ActiveShareBar;
