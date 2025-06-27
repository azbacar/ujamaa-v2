
import { useState } from 'react';
import Header from '@/components/Header';
import IslandSelector from '@/components/IslandSelector';
import QuickActions from '@/components/QuickActions';
import HeroSection from '@/components/HeroSection';
import StatisticsCard from '@/components/StatisticsCard';
import AIAssistantSection from '@/components/AIAssistantSection';
import Footer from '@/components/Footer';
import CategoriesSection from '@/components/CategoriesSection';

const Index = () => {
  const [currentLanguage, setCurrentLanguage] = useState('fr');

  return (
    <div className="min-h-screen">
      <Header currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
      
      <main className="container mx-auto px-6 py-12 space-y-16">
        <HeroSection />
        <IslandSelector />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <CategoriesSection />
          </div>
          
          <div className="space-y-8">
            <QuickActions />
            <StatisticsCard />
          </div>
        </div>

        <AIAssistantSection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
