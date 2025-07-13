import { useState } from 'react';
import { Search, Menu, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import NotificationSystem from './NotificationSystem';

interface HeaderProps {
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
}

const Header = ({ currentLanguage, onLanguageChange }: HeaderProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'sw', name: 'Kiswahili', flag: '🇹🇿' },
    { code: 'zdj', name: 'Shikomori', flag: '🇰🇲' }
  ];

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
              🏠 Accueil
            </Link>
            <Link to="/prix" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              💰 Prix & Marchés
            </Link>
            <Link to="/appels-offres" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              📋 Appels d'Offres
            </Link>
            <Link to="/evenements" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              🎭 Événements
            </Link>
            <Link to="/services" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              🏛️ Services
            </Link>
          </nav>

          {/* Barre de recherche */}
          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-500 w-5 h-5" />
            <Input
              type="text"
              placeholder="🔍 Rechercher des informations, prix, événements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 h-12 bg-white/90 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/20 rounded-2xl shadow-sm text-base placeholder:text-gray-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Sélecteur de langue */}
            <div className="relative group">
              <Button variant="outline" size="sm" className="gap-3 px-4 py-2 h-12 rounded-xl border-emerald-200 bg-white/80 hover:bg-emerald-50">
                <Globe className="w-5 h-5 text-emerald-600" />
                <span className="text-xl">
                  {languages.find(lang => lang.code === currentLanguage)?.flag}
                </span>
                <span className="hidden sm:inline font-semibold text-emerald-700">
                  {languages.find(lang => lang.code === currentLanguage)?.code.toUpperCase()}
                </span>
              </Button>
            </div>

            {/* Notifications */}
            <NotificationSystem />

            {/* Menu mobile */}
            <Button variant="outline" size="sm" className="lg:hidden h-12 w-12 rounded-xl border-emerald-200 bg-white/80 hover:bg-emerald-50">
              <Menu className="w-5 h-5 text-emerald-600" />
              <span className="sr-only">Menu</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;