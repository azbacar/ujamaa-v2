import { useState, useEffect } from 'react';
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
import LiveStatsBar from '@/components/LiveStatsBar';
import RecentContentSection from '@/components/RecentContentSection';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { usePageSEO } from '@/hooks/usePageSEO';
import { useJsonLd } from '@/hooks/useJsonLd';

interface HomepageSection {
  id: string;
  section_key: string;
  title: string;
  is_visible: boolean;
  sort_order: number;
}

const Index = () => {
  const { currentLanguage, setLanguage } = useLanguage();
  const { user } = useAuth();
  const { isAdmin, isModerator } = useRole();
  const [sections, setSections] = useState<HomepageSection[]>([]);

  usePageSEO({
    canonicalPath: '/',
    keywords: 'Comores, prix, événements, services, annonces, investissement, diaspora, Moroni, Anjouan, Mohéli, Mayotte',
  });
  useJsonLd();

  useEffect(() => {
    const fetchSections = async () => {
      const { data } = await supabase
        .from('homepage_sections')
        .select('*')
        .order('sort_order', { ascending: true });
      if (data) setSections(data);
    };
    fetchSections();
  }, []);

  const isSectionVisible = (key: string) => {
    const section = sections.find(s => s.section_key === key);
    return section ? section.is_visible : true; // default visible if not in DB
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* Alerts */}
        {isSectionVisible('alerts') && <LiveUrgentAlerts />}

        {/* Hero - compact dashboard style */}
        {isSectionVisible('hero') && <HeroSection />}

        {/* Live stats strip */}
        <LiveStatsBar />

        {/* Ad banner */}
        {isSectionVisible('ads_header') && (
          <div className="flex justify-center"><AdSpace size="banner" position="header" /></div>
        )}

        {/* Islands */}
        {isSectionVisible('islands') && <IslandSelector />}

        {/* Main content grid: 2-column dashboard layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left column - main content */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Announcements */}
            {isSectionVisible('announcements') && <AnnouncementsSection />}

            {/* Categories */}
            {isSectionVisible('categories') && <CategoriesSection />}
            
            {/* Content ad */}
            {isSectionVisible('ads_content') && (
              <div className="flex justify-center"><AdSpace size="medium" position="content" /></div>
            )}
          </div>

          {/* Right column - sidebar widgets */}
          <div className="space-y-6">
            {/* Recent activity feed */}
            <RecentContentSection />

            {/* Quick actions / urgent info */}
            {isSectionVisible('quick_actions') && <QuickActions />}

            {/* Sidebar ad */}
            {isSectionVisible('ads_sidebar') && <AdSpace size="medium" position="sidebar" />}

            {/* Admin stats */}
            {isSectionVisible('statistics') && user && (isAdmin() || isModerator()) && <StatisticsCard />}

            {/* Second sidebar ad */}
            {isSectionVisible('ads_sidebar_2') && <AdSpace size="small" position="sidebar" />}
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
};

export default Index;
