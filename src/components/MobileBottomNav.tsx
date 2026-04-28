import { Link, useLocation } from "react-router-dom";
import { Home, DollarSign, MapPin, Megaphone, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { authPath } from "@/lib/authRedirect";
import { cn } from "@/lib/utils";

/**
 * Fixed bottom navigation for mobile devices (visible only < lg).
 * Quick access to Home, Prices, Map, Announcements, Profile/Login.
 */
const MobileBottomNav = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const items = [
    { to: "/", label: "Accueil", icon: Home, match: (p: string) => p === "/" },
    { to: "/prix", label: "Prix", icon: DollarSign, match: (p: string) => p.startsWith("/prix") },
    {
      to: "/carte-vendeurs",
      label: "Carte",
      icon: MapPin,
      match: (p: string) => p.startsWith("/carte"),
      highlight: true,
    },
    { to: "/annonces", label: "Annonces", icon: Megaphone, match: (p: string) => p.startsWith("/annonces") },
    {
      to: user ? "/profile" : authPath(),
      label: user ? "Profil" : "Connexion",
      icon: User,
      match: (p: string) => p.startsWith("/profile") || p.startsWith("/auth"),
    },
  ];

  // Hide on admin / annonceur dashboards to keep them clean
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/annonceur") ||
    pathname.startsWith("/entreprise") ||
    pathname.startsWith("/api-docs")
  ) {
    return null;
  }

  return (
    <nav
      aria-label="Navigation mobile"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-emerald-100 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active = it.match(pathname);
          const Icon = it.icon;
          return (
            <li key={it.label} className="flex">
              <Link
                to={it.to}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                  active ? "text-emerald-600" : "text-gray-500 hover:text-emerald-500",
                  it.highlight && !active && "text-emerald-500"
                )}
              >
                <Icon className={cn("w-5 h-5", it.highlight && "drop-shadow")} />
                <span className="truncate max-w-full px-1">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
