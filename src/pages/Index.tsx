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
import Footer from '@/components/Footer';

const Index = () => {
  const { currentLanguage, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen">
      <Header 
        currentLanguage={currentLanguage} 
        onLanguageChange={setLanguage}
      />
      
      <main className="container mx-auto px-6 py-12 space-y-16">
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
              <AdSpace size="large" position="content" />
            </div>
          </div>
          
          <div className="space-y-8">
            <QuickActions />
            
            {/* Espace publicitaire sidebar */}
            <AdSpace size="medium" position="sidebar" />
            
            <StatisticsCard />
            
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