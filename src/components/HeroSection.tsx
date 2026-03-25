
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/components/LanguageProvider';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Search } from 'lucide-react';
import { useState } from 'react';

const HeroSection = () => {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();
  const [searchOpen, setSearchOpen] = useState(false);
  
  const heroStyle = settings?.hero_image_url ? {
    backgroundImage: `linear-gradient(135deg, hsl(var(--primary) / 0.92), hsl(var(--secondary) / 0.88)), url(${settings.hero_image_url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  } : {};

  const openSearch = () => {
    window.dispatchEvent(new CustomEvent('openFullScreenSearch'));
  };

  return (
    <section 
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-secondary px-5 py-8 sm:px-10 sm:py-12 text-primary-foreground"
      style={heroStyle}
    >
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      
      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-5">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
          {settings?.hero_title || t('hero.title')}
        </h1>
        <p className="text-sm sm:text-lg text-primary-foreground/85 max-w-2xl mx-auto leading-relaxed font-medium">
          {settings?.hero_subtitle || t('hero.subtitle')}
        </p>
        
        {/* Search bar */}
        <button
          onClick={openSearch}
          className="mx-auto flex items-center gap-3 w-full max-w-md bg-white/15 backdrop-blur-sm border border-white/25 rounded-xl px-4 py-3 text-left text-primary-foreground/70 hover:bg-white/25 transition-all cursor-pointer"
        >
          <Search className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">Rechercher prix, événements, services...</span>
        </button>

        {/* Quick nav pills */}
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {[
            { label: '💰 Prix', to: '/prix' },
            { label: '📅 Événements', to: '/evenements' },
            { label: '📋 Appels d\'offres', to: '/appels-offres' },
            { label: '💼 Freelance', to: '/freelance' },
            { label: '🌍 Investissement', to: '/investissement' },
          ].map(item => (
            <Link
              key={item.to}
              to={item.to}
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-sm text-xs sm:text-sm font-medium transition-all border border-white/10 hover:border-white/30"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
