import { Link } from 'react-router-dom';
import { useLanguage } from '@/components/LanguageProvider';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Search, TrendingUp, Calendar, Globe, Zap, Users } from 'lucide-react';

const HeroSection = () => {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();

  const heroStyle = settings?.hero_image_url ? {
    backgroundImage: `linear-gradient(135deg, hsl(160 84% 20% / 0.92), hsl(199 89% 30% / 0.88)), url(${settings.hero_image_url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  } : {};

  const openSearch = () => {
    window.dispatchEvent(new CustomEvent('openFullScreenSearch'));
  };

  const quickLinks = [
    { label: 'Prix', icon: TrendingUp, to: '/prix' },
    { label: 'Événements', icon: Calendar, to: '/evenements' },
    { label: 'Freelance', icon: Zap, to: '/freelance' },
    { label: 'Investissement', icon: Globe, to: '/investissement' },
    { label: 'Freelancers', icon: Users, to: '/freelancers' },
  ];

  return (
    <section
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-ocean-600 text-white"
      style={heroStyle}
    >
      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-ocean-400/10 blur-xl" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.5'%3E%3Cpath d='M0 30h60M30 0v60'/%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-14 md:px-16 md:py-16">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5 text-xs font-medium text-white/90">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            Plateforme #1 d'information aux Comores
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
            {settings?.hero_title || t('hero.title')}
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-white/75 max-w-xl mx-auto leading-relaxed">
            {settings?.hero_subtitle || t('hero.subtitle')}
          </p>

          {/* Search bar */}
          <button
            onClick={openSearch}
            className="mx-auto flex items-center gap-3 w-full max-w-lg bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3.5 text-left text-white/50 hover:bg-white/20 hover:border-white/35 transition-all duration-300 cursor-pointer group shadow-lg shadow-black/10"
          >
            <Search className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform text-white/60" />
            <span className="text-sm flex-1">Rechercher prix, événements, services...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg bg-white/10 text-[10px] font-mono text-white/40 border border-white/10">
              ⌘K
            </kbd>
          </button>

          {/* Quick nav */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {quickLinks.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm text-xs sm:text-sm font-medium transition-all duration-200 border border-white/10 hover:border-white/25 hover:shadow-lg hover:shadow-black/5"
              >
                <item.icon className="w-3.5 h-3.5" />
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
