import Header from '@/components/Header';
import { useLanguage } from '@/components/LanguageProvider';
import IslandSelector from '@/components/IslandSelector';
import QuickActions from '@/components/QuickActions';
import HeroSection from '@/components/HeroSection';
import StatisticsCard from '@/components/StatisticsCard';
import AIAssistantSection from '@/components/AIAssistantSection';
import CategoriesSection from '@/components/CategoriesSection';
import AnnouncementsSection from '@/components/AnnouncementsSection';
import SearchSystem from '@/components/SearchSystem';
import Footer from '@/components/Footer';
import { useState } from 'react';

const Index = () => {
  const { currentLanguage, setLanguage } = useLanguage();
  const [showSearchResults, setShowSearchResults] = useState(false);

  const handleSearch = (query: string) => {
    setShowSearchResults(true);
    // Scroll vers la section de recherche
    setTimeout(() => {
      document.getElementById('search-section')?.scrollIntoView({ 
        behavior: 'smooth' 
      });
    }, 100);
  };

  return (
    <div className="min-h-screen">
      <Header 
        currentLanguage={currentLanguage} 
        onLanguageChange={setLanguage}
        onSearch={handleSearch}
      />
      
      <main className="container mx-auto px-6 py-12 space-y-16">
        <HeroSection />
        
        {/* Section de recherche dynamique */}
        <div id="search-section">
          <SearchSystem />
        </div>
        
        <IslandSelector />

        {/* Section Annonces IA */}
        <AnnouncementsSection />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <CategoriesSection />
          </div>
          
          <div className="space-y-8">
            <QuickActions />
            <StatisticsCard />
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