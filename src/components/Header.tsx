
import { useState } from 'react';
import { Search, Menu, Globe, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    <header className="sticky top-0 z-50 glass-effect border-b border-emerald-100/50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo et Titre */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-ocean-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              U
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">UJAMAA</h1>
              <p className="text-sm text-muted-foreground">Call Center</p>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="flex-1 max-w-2xl relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Rechercher des informations, prix, événements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 h-12 bg-white/80 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/20"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Sélecteur de langue */}
            <div className="relative group">
              <Button variant="outline" size="sm" className="gap-2">
                <Globe className="w-4 h-4" />
                {languages.find(lang => lang.code === currentLanguage)?.flag}
                <span className="hidden sm:inline">
                  {languages.find(lang => lang.code === currentLanguage)?.code.toUpperCase()}
                </span>
              </Button>
            </div>

            {/* Notifications */}
            <Button variant="outline" size="sm">
              <Bell className="w-4 h-4" />
              <span className="sr-only">Notifications</span>
            </Button>

            {/* Menu mobile */}
            <Button variant="outline" size="sm" className="sm:hidden">
              <Menu className="w-4 h-4" />
              <span className="sr-only">Menu</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
