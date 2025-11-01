import { useState, useEffect } from 'react';
import { Search, Menu, Globe, User, LogOut, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/components/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import NotificationSystemReal from './NotificationSystemReal';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'sw', name: 'Kiswahili', flag: '🇹🇿' },
    { code: 'zdj', name: 'Shikomori', flag: '🇰🇲' }
  ];

  const mockData = [
    { type: 'prix', title: 'Prix du Riz', description: 'Riz blanc qualité A - 500 FC/kg', url: '/prix', category: 'Alimentation' },
    { type: 'prix', title: 'Prix de la Vanille', description: 'Vanille premium - 15000 FC/kg', url: '/prix', category: 'Épices' },
    { type: 'evenement', title: 'Festival de Moroni', description: 'Festival culturel du 15-20 mars', url: '/evenements', category: 'Culture' },
    { type: 'service', title: 'Préfecture Grande Comore', description: 'Services administratifs', url: '/services', category: 'Administration' },
    { type: 'service', title: 'Hôpital de Mutsamudu', description: 'Services de santé', url: '/services', category: 'Santé' },
    { type: 'offre', title: 'Construction École', description: 'Appel d\'offres école primaire', url: '/appels-offres', category: 'BTP' }
  ];

  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    
    // Simulation recherche Ajax intelligente
    setTimeout(() => {
      const results = mockData.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(results);
      setShowSearchResults(true);
      setIsSearching(false);
    }, 300);
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      performSearch(searchTerm);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Recherche en temps réel
  useEffect(() => {
    if (searchTerm) {
      performSearch(searchTerm);
    } else {
      setShowSearchResults(false);
    }
  }, [searchTerm]);

  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-white/20 shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Logo et Titre */}
          <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 via-emerald-600 to-ocean-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              U
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Ujamaan</h1>
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
            <Link to="/pro" className="text-emerald-700 hover:text-emerald-800 font-bold transition-colors bg-emerald-50 px-3 py-1 rounded-lg">
              ⭐ Pro
            </Link>
          </nav>

          {/* Barre de recherche */}
          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-500 w-5 h-5" />
            <Input
              type="text"
              placeholder={`🔍 ${t('hero.search')}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => searchTerm && setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              className="pl-12 pr-16 h-12 bg-white/90 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/20 rounded-2xl shadow-sm text-base placeholder:text-gray-500"
            />
            <Button
              onClick={handleSearch}
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-ocean-500 h-8 px-3"
            >
              <Search className="w-4 h-4" />
            </Button>

            {/* Résultats de recherche Ajax */}
            {showSearchResults && (
              <div className="absolute top-14 left-0 right-0 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Recherche en cours...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    <div className="p-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-700">
                        {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    {searchResults.map((result, index) => (
                      <a
                        key={index}
                        href={result.url}
                        className="block p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                        onClick={() => setShowSearchResults(false)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            result.type === 'prix' ? 'bg-green-100 text-green-600' :
                            result.type === 'evenement' ? 'bg-blue-100 text-blue-600' :
                            result.type === 'service' ? 'bg-purple-100 text-purple-600' :
                            'bg-orange-100 text-orange-600'
                          }`}>
                            {result.type === 'prix' ? '💰' :
                             result.type === 'evenement' ? '🎭' :
                             result.type === 'service' ? '🏛️' : '📋'}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{result.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{result.description}</p>
                            <span className="text-xs text-emerald-600 font-medium">{result.category}</span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-500">Aucun résultat trouvé pour "{searchTerm}"</p>
                  </div>
                )}
              </div>
            )}
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
    </header>
  );
};

export default Header;