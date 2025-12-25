import Header from '@/components/Header';
import { useLanguage } from '@/components/LanguageProvider';
import IslandSelector from '@/components/IslandSelector';
import QuickActions from '@/components/QuickActions';
import HeroSection from '@/components/HeroSection';
import StatisticsCard from '@/components/StatisticsCard';
import AIAssistantSection from '@/components/AIAssistantSection';
import CategoriesSection from '@/components/CategoriesSection';
import AnnouncementsSection from '@/components/AnnouncementsSection';
import AdSpace from '@/components/AdSpace';
import LiveUrgentAlerts from '@/components/LiveUrgentAlerts';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';

const Index = () => {
  const { currentLanguage, setLanguage } = useLanguage();
  const { user } = useAuth();
  const { isAdmin, isModerator } = useRole();

  return (
    <div className="min-h-screen">
      <Header 
        currentLanguage={currentLanguage} 
        onLanguageChange={setLanguage}
      />
      
      <main className="container mx-auto px-6 py-12 space-y-16">
        {/* Alertes urgentes en temps réel */}
        <LiveUrgentAlerts />
        
        <HeroSection />
        
        {/* Espace publicitaire header */}
        <div className="flex justify-center">
          <AdSpace size="banner" position="header" />
        </div>
        
        <IslandSelector />

        {/* Section Annonces IA */}
        <AnnouncementsSection />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <CategoriesSection />
            
            {/* Espace publicitaire dans le contenu */}
            <div className="my-8 flex justify-center">
              <AdSpace size="medium" position="content" />
            </div>
          </div>
          
          <div className="space-y-8">
            <QuickActions />
            
            {/* Espace publicitaire sidebar */}
            <AdSpace size="medium" position="sidebar" />
            
            {user && (isAdmin() || isModerator()) ? <StatisticsCard /> : null}
            
            {/* Autre espace publicitaire sidebar */}
            <AdSpace size="small" position="sidebar" />
          </div>
        </div>
        
        {/* Section Assistant IA */}
        <AIAssistantSection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;