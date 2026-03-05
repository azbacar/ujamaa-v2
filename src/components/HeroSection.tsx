
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/components/LanguageProvider';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const HeroSection = () => {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();
  
  const heroStyle = settings?.hero_image_url ? {
    backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.85)), url(${settings.hero_image_url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  } : {};

  return (
    <section className="text-center space-y-6 sm:space-y-8 py-10 sm:py-16 hero-gradient rounded-2xl sm:rounded-3xl px-4 sm:px-8" style={heroStyle}>
      <div className="space-y-4 sm:space-y-6">
        <div className="floating-element">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black gradient-text mb-3 sm:mb-4">
            {settings?.hero_title || t('hero.title')}
          </h1>
          <div className="w-24 sm:w-32 h-1 bg-gradient-to-r from-emerald-500 to-ocean-500 mx-auto rounded-full"></div>
        </div>
        <p className="text-base sm:text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed font-medium">
          {settings?.hero_subtitle || t('hero.subtitle')}
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center pt-4 sm:pt-8">
        <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 via-emerald-600 to-ocean-500 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-2xl font-bold shadow-2xl hover:shadow-magenta-500/50 transition-all text-base sm:text-lg h-auto" asChild>
          <Link to="/prix">🚀 {t('common.viewMore')}</Link>
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          className="w-full sm:w-auto border-2 border-emerald-300 text-emerald-700 px-8 sm:px-10 py-3 sm:py-4 rounded-2xl font-bold bg-white/80 hover:bg-emerald-50 text-base sm:text-lg h-auto"
          onClick={() => {
            const element = document.getElementById('assistant-ia');
            if (element) element.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          🤖 {t('ai.title')}
        </Button>
      </div>
    </section>
  );
};

export default HeroSection;
