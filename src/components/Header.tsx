import { useState, useEffect } from 'react';
import { Search, Menu, X, User, LogOut, Settings, Shield, MessageCircle, Building2, Home, DollarSign, Megaphone, Calendar, Landmark, Briefcase, Users, Palmtree, MapPin, Globe2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/components/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { Megaphone } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import NotificationSystem from './NotificationSystem';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import FullScreenSearch from './FullScreenSearch';
import { useUnreadCount } from '@/hooks/useMessages';
import { authPath, proPath } from '@/lib/authRedirect';

interface HeaderProps {
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
}

const Header = ({ currentLanguage, onLanguageChange }: HeaderProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { role, isAdmin, isModerator, isAnnonceur } = useRole();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showFullScreenSearch, setShowFullScreenSearch] = useState(false);
  const { data: unreadCount } = useUnreadCount();

  useEffect(() => {
    const handler = () => setShowFullScreenSearch(true);
    window.addEventListener('openFullScreenSearch', handler);
    return () => window.removeEventListener('openFullScreenSearch', handler);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-white/20 shadow-lg">
      <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-4 hover:opacity-80 transition-opacity flex-shrink-0">
            {settings?.site_logo_url ? (
              <img 
                src={settings.site_logo_url} 
                alt={settings.site_name || 'Logo'} 
                className="w-10 h-10 sm:w-14 sm:h-14 object-contain"
              />
            ) : (
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 via-emerald-600 to-ocean-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-2xl shadow-lg">
                U
              </div>
            )}
            <div className="hidden sm:block">
              <h1 className="text-xl sm:text-2xl font-bold gradient-text">{settings?.site_name || 'Ujamaan'}</h1>
              <p className="text-xs sm:text-sm text-emerald-600 font-medium">Call Center</p>
            </div>
          </Link>

          {/* Navigation desktop */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link to="/prix" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              💰 Prix
            </Link>
            <Link to="/annonces" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              📢 {t('nav.announcements')}
            </Link>
            <Link to="/evenements" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              🎭 {t('nav.events')}
            </Link>
            <Link to="/services" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              🏛️ {t('nav.services')}
            </Link>
            <Link to="/freelance" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              💼 Missions
            </Link>
            <Link to="/freelancers" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              👨‍💻 Freelancers
            </Link>
            <Link to="/tourisme" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              🏝️ Tourisme
            </Link>
            <Link to="/carte-vendeurs" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              📍 Carte
            </Link>
            <Link to="/investissement" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              🌍 Invest
            </Link>
          </nav>

          <div className="hidden lg:block flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFullScreenSearch(true)}
              className="h-10 w-10 rounded-xl text-emerald-600"
            >
              <Search className="w-5 h-5" />
            </Button>

            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/messages')}
                className="hidden sm:flex h-10 w-10 rounded-xl text-emerald-600 relative"
              >
                <MessageCircle className="w-5 h-5" />
                {(unreadCount ?? 0) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            )}

            <NotificationSystem />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 sm:h-12 px-2 sm:px-4 rounded-xl border-emerald-200 bg-white/80 hover:bg-emerald-50">
                    <User className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Profil</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.email}</p>
                    <p className="text-xs text-gray-500 capitalize">{role}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Mon compte
                  </DropdownMenuItem>
                  {isAnnonceur() && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/annonceur')}>
                        <Megaphone className="h-4 w-4 mr-2" />
                        Espace Annonceur
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/entreprise')}>
                    <Building2 className="h-4 w-4 mr-2" />
                    Espace Entreprise
                  </DropdownMenuItem>
                  {(isAdmin() || isModerator()) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Shield className="h-4 w-4 mr-2" />
                        {isAdmin() ? 'Administration' : 'Modération'}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="default" 
                size="sm" 
                className="h-10 sm:h-12 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-ocean-500 text-xs sm:text-sm"
                onClick={() => navigate(authPath())}
              >
                Connexion
              </Button>
            )}

            {/* Menu mobile */}
            <div className="lg:hidden">
              <Button
                variant="outline"
                size="sm"
                className="h-11 w-11 rounded-xl border-emerald-200 bg-white/80 hover:bg-emerald-50"
                onClick={() => setShowMobileMenu(true)}
                aria-label="Ouvrir le menu"
              >
                <Menu className="w-5 h-5 text-emerald-600" />
              </Button>

              {showMobileMenu && (
                <div className="fixed inset-0 z-[60] flex flex-col bg-white">
                  <div className="flex items-center justify-between border-b border-emerald-100 px-5 py-4">
                    <span className="text-lg font-bold gradient-text">{settings?.site_name || 'Ujamaan'}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 rounded-xl text-gray-600"
                      onClick={() => setShowMobileMenu(false)}
                      aria-label="Fermer le menu"
                    >
                      <X className="w-6 h-6" />
                    </Button>
                  </div>
                  <nav className="flex-1 overflow-y-auto px-4 py-4 pb-[env(safe-area-inset-bottom)]">
                    <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Explorer</p>
                    <ul className="space-y-1">
                      {[
                        { to: '/', label: 'Accueil', icon: Home },
                        { to: '/prix', label: 'Prix', icon: DollarSign },
                        { to: '/annonces', label: t('nav.announcements'), icon: Megaphone },
                        { to: '/evenements', label: t('nav.events'), icon: Calendar },
                        { to: '/services', label: t('nav.services'), icon: Landmark },
                        { to: '/carte-vendeurs', label: 'Carte des vendeurs', icon: MapPin },
                      ].map(({ to, label, icon: Icon }) => (
                        <li key={to}>
                          <Link
                            to={to}
                            onClick={() => setShowMobileMenu(false)}
                            className="flex items-center gap-4 rounded-xl px-3 py-3.5 text-base font-medium text-gray-800 active:bg-emerald-50 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                              <Icon className="w-5 h-5" />
                            </span>
                            {label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <p className="px-2 pb-2 pt-5 text-xs font-semibold uppercase tracking-wide text-gray-400">Professionnel</p>
                    <ul className="space-y-1">
                      {[
                        { to: '/freelance', label: 'Missions freelance', icon: Briefcase },
                        { to: '/freelancers', label: 'Répertoire Freelancers', icon: Users },
                        { to: '/tourisme', label: 'Tourisme', icon: Palmtree },
                        { to: '/investissement', label: 'Invest', icon: Globe2 },
                      ].map(({ to, label, icon: Icon }) => (
                        <li key={to}>
                          <Link
                            to={to}
                            onClick={() => setShowMobileMenu(false)}
                            className="flex items-center gap-4 rounded-xl px-3 py-3.5 text-base font-medium text-gray-800 active:bg-emerald-50 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ocean-50 text-ocean-600">
                              <Icon className="w-5 h-5" />
                            </span>
                            {label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5 border-t border-gray-100 pt-4">
                      <Link
                        to="/guide"
                        onClick={() => setShowMobileMenu(false)}
                        className="flex items-center gap-4 rounded-xl px-3 py-3.5 text-base font-semibold text-emerald-700 active:bg-emerald-50 hover:bg-emerald-50 transition-colors"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                          <BookOpen className="w-5 h-5" />
                        </span>
                        Guide d'utilisation
                      </Link>
                    </div>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <FullScreenSearch 
        isOpen={showFullScreenSearch} 
        onClose={() => setShowFullScreenSearch(false)} 
      />
    </header>
  );
};

export default Header;
