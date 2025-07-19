import { useState } from 'react';
import { Search, Menu, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/components/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import NotificationSystem from './NotificationSystem';

interface HeaderProps {
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
  onSearch?: (query: string) => void;
}

const Header = ({ currentLanguage, onLanguageChange, onSearch }: HeaderProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'sw', name: 'Kiswahili', flag: '🇹🇿' },
    { code: 'zdj', name: 'Shikomori', flag: '🇰🇲' }
  ];

  const handleSearch = () => {
    if (searchTerm.trim()) {
      onSearch?.(searchTerm);
      toast({
        title: "Recherche lancée",
        description: `Recherche pour: "${searchTerm}"`,
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

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
              <h1 className="text-2xl font-bold gradient-text">UJAMAA</h1>
              <p className="text-sm text-emerald-600 font-medium">Call Center</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              🏠 {t('nav.home')}
            </Link>
            <Link to="/prix" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              💰 {t('nav.prices')}
            </Link>
            <Link to="/appels-offres" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              📋 {t('nav.tenders')}
            </Link>
            <Link to="/evenements" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              🎭 {t('nav.events')}
            </Link>
            <Link to="/services" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              🏛️ {t('nav.services')}
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
              className="pl-12 pr-16 h-12 bg-white/90 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/20 rounded-2xl shadow-sm text-base placeholder:text-gray-500"
            />
            <Button
              onClick={handleSearch}
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-ocean-500 h-8 px-3"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Sélecteur de langue */}
            <div className="relative group">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-3 px-4 py-2 h-12 rounded-xl border-emerald-200 bg-white/80 hover:bg-emerald-50"
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              >
                <Globe className="w-5 h-5 text-emerald-600" />
                <span className="text-xl">
                  {languages.find(lang => lang.code === currentLanguage)?.flag}
                </span>
                <span className="hidden sm:inline font-semibold text-emerald-700">
                  {languages.find(lang => lang.code === currentLanguage)?.code.toUpperCase()}
                </span>
              </Button>
              
              {showLanguageMenu && (
                <div className="absolute right-0 top-14 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                  <div className="py-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        className="w-full px-4 py-3 text-left hover:bg-emerald-50 flex items-center gap-3 transition-colors"
                        onClick={() => {
                          onLanguageChange(lang.code);
                          setShowLanguageMenu(false);
                        }}
                      >
                        <span className="text-xl">{lang.flag}</span>
                        <div>
                          <div className="font-medium text-gray-900">{lang.name}</div>
                          <div className="text-xs text-gray-500">{lang.code.toUpperCase()}</div>
                        </div>
                        {currentLanguage === lang.code && (
                          <div className="ml-auto w-2 h-2 bg-emerald-500 rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <NotificationSystem />

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
                      to="/" 
                      className="block px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      🏠 {t('nav.home')}
                    </Link>
                    <Link 
                      to="/prix" 
                      className="block px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      💰 {t('nav.prices')}
                    </Link>
                    <Link 
                      to="/appels-offres" 
                      className="block px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      📋 {t('nav.tenders')}
                    </Link>
                    <Link 
                      to="/evenements" 
                      className="block px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      🎭 {t('nav.events')}
                    </Link>
                    <Link 
                      to="/services" 
                      className="block px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      🏛️ {t('nav.services')}
                    </Link>
                    <Link 
                      to="/annonces" 
                      className="block px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      📢 {t('nav.announcements')}
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