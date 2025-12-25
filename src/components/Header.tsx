import { useState, useEffect } from 'react';
import { Search, Menu, Globe, User, LogOut, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/components/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import NotificationSystemReal from './NotificationSystemReal';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import FullScreenSearch from './FullScreenSearch';

interface HeaderProps {
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
}

const Header = ({ currentLanguage, onLanguageChange }: HeaderProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { role, isAdmin, isModerator } = useRole();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showFullScreenSearch, setShowFullScreenSearch] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-white/20 shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Logo et Titre */}
          <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            {settings?.site_logo_url ? (
              <img 
                src={settings.site_logo_url} 
                alt={settings.site_name || 'Logo'} 
                className="w-14 h-14 object-contain"
              />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 via-emerald-600 to-ocean-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                U
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold gradient-text">{settings?.site_name || 'Ujamaan'}</h1>
              <p className="text-sm text-emerald-600 font-medium">Call Center</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link to="/prix" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              💰 {t('nav.prices')}
            </Link>
            <Link to="/annonces" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              📢 {t('nav.announcements')}
            </Link>
            <Link to="/evenements" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              🎭 {t('nav.events')}
            </Link>
            <Link to="/appels-offres" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              📋 {t('nav.tenders')}
            </Link>
            <Link to="/services" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              🏛️ {t('nav.services')}
            </Link>
          </nav>

          {/* Bouton de recherche plein écran */}
          <div className="flex-1 max-w-xl">
            <Button
              variant="outline"
              onClick={() => setShowFullScreenSearch(true)}
              className="w-full h-12 justify-start gap-3 bg-white/90 border-emerald-200 hover:border-emerald-400 rounded-2xl shadow-sm text-base text-muted-foreground"
            >
              <Search className="w-5 h-5 text-emerald-500" />
              <span>🔍 {t('hero.search')}</span>
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <NotificationSystemReal />

            {/* Authentication */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-12 px-4 rounded-xl border-emerald-200 bg-white/80 hover:bg-emerald-50">
                    <User className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Profil</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.email}</p>
                    <p className="text-xs text-gray-500 capitalize">{role}</p>
                  </div>
                  <DropdownMenuSeparator />
                  
                  {/* Section gestion compte pour tous */}
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Mon compte
                  </DropdownMenuItem>
                  
                  {/* Section admin pour admins et modérateurs */}
                  {(isAdmin || isModerator) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Shield className="h-4 w-4 mr-2" />
                        {isAdmin ? 'Administration' : 'Modération'}
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
                className="h-12 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-ocean-500"
                onClick={() => navigate('/auth')}
              >
                Connexion
              </Button>
            )}

            {/* Menu mobile */}
            <div className="lg:hidden relative">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-12 w-12 rounded-xl border-emerald-200 bg-white/80 hover:bg-emerald-50"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <Menu className="w-5 h-5 text-emerald-600" />
                <span className="sr-only">Menu</span>
              </Button>
              
              {showMobileMenu && (
                <div className="absolute right-0 top-14 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                  <nav className="py-2">
                    <Link 
                      to="/prix" 
                      className="block px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      💰 {t('nav.prices')}
                    </Link>
                    <Link 
                      to="/annonces" 
                      className="block px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      📢 {t('nav.announcements')}
                    </Link>
                    <Link 
                      to="/evenements" 
                      className="block px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      🎭 {t('nav.events')}
                    </Link>
                    <Link 
                      to="/appels-offres" 
                      className="block px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      📋 {t('nav.tenders')}
                    </Link>
                    <Link 
                      to="/services" 
                      className="block px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      🏛️ {t('nav.services')}
                    </Link>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Full Screen Search Modal */}
      <FullScreenSearch 
        isOpen={showFullScreenSearch} 
        onClose={() => setShowFullScreenSearch(false)} 
      />
    </header>
  );
};

export default Header;