import { Link } from 'react-router-dom';
import { useLanguage } from '@/components/LanguageProvider';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Search, TrendingUp, Calendar, Briefcase, Globe, Zap } from 'lucide-react';

const HeroSection = () => {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();

  const heroStyle = settings?.hero_image_url ? {
    backgroundImage: `linear-gradient(135deg, hsl(var(--primary) / 0.93), hsl(var(--secondary) / 0.88)), url(${settings.hero_image_url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  } : {};

  const openSearch = () => {
    window.dispatchEvent(new CustomEvent('openFullScreenSearch'));
  };

  const quickLinks = [
    { label: 'Prix', icon: TrendingUp, to: '/prix' },
    { label: 'Événements', icon: Calendar, to: '/evenements' },
    { label: 'Appels d\'offres', icon: Briefcase, to: '/appels-offres' },
    { label: 'Freelance', icon: Zap, to: '/freelance' },
    { label: 'Investissement', icon: Globe, to: '/investissement' },
  ];

  return (
    <section
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-secondary text-primary-foreground"
      style={heroStyle}
    >
      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2l2 3-2 3z'/%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="relative z-10 px-5 py-7 sm:px-8 sm:py-10 md:px-12 md:py-12">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          {/* Title */}
          <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            {settings?.hero_title || t('hero.title')}
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-primary-foreground/80 max-w-xl mx-auto leading-relaxed">
            {settings?.hero_subtitle || t('hero.subtitle')}
          </p>

          {/* Search bar */}
          <button
            onClick={openSearch}
            className="mx-auto flex items-center gap-3 w-full max-w-lg bg-white/15 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 text-left text-primary-foreground/60 hover:bg-white/25 hover:border-white/35 transition-all duration-200 cursor-pointer group"
          >
            <Search className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-sm flex-1">Rechercher prix, événements, services...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-primary-foreground/50">
              ⌘K
            </kbd>
          </button>

          {/* Quick nav */}
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 pt-1">
            {quickLinks.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm text-xs sm:text-sm font-medium transition-all duration-200 border border-white/5 hover:border-white/20"
              >
                <item.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
