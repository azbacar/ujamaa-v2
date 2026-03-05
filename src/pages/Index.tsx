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
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';

interface HomepageSection {
  id: string;
  section_key: string;
  title: string;
  is_visible: boolean;
  sort_order: number;
}

const SECTION_COMPONENTS: Record<string, React.FC<any>> = {
  alerts: LiveUrgentAlerts,
  hero: HeroSection,
  islands: IslandSelector,
  announcements: AnnouncementsSection,
  categories: CategoriesSection,
  quick_actions: QuickActions,
  ai_assistant: AIAssistantSection,
};

const Index = () => {
  const { currentLanguage, setLanguage } = useLanguage();
  const { user } = useAuth();
  const { isAdmin, isModerator } = useRole();
  const [sections, setSections] = useState<HomepageSection[]>([]);

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

  const renderSection = (section: HomepageSection) => {
    if (!section.is_visible) return null;

    // Ad sections
    if (section.section_key === 'ads_header') {
      return <div key={section.id} className="flex justify-center"><AdSpace size="banner" position="header" /></div>;
    }
    if (section.section_key === 'ads_content') {
      return <div key={section.id} className="my-8 flex justify-center"><AdSpace size="medium" position="content" /></div>;
    }
    if (section.section_key === 'ads_sidebar' || section.section_key === 'ads_sidebar_2') {
      return null; // rendered inside sidebar grid
    }
    if (section.section_key === 'statistics') {
      return user && (isAdmin() || isModerator()) ? <StatisticsCard key={section.id} /> : null;
    }

    const Component = SECTION_COMPONENTS[section.section_key];
    if (Component) return <Component key={section.id} />;
    return null;
  };

  // Split sections into main flow and sidebar items
  const mainSections = sections.filter(s => 
    !['categories', 'quick_actions', 'ads_sidebar', 'statistics', 'ads_sidebar_2', 'ads_content'].includes(s.section_key)
  );
  const sidebarVisible = sections.some(s => ['quick_actions', 'statistics'].includes(s.section_key) && s.is_visible);
  const categoriesSection = sections.find(s => s.section_key === 'categories');
  const adsContentSection = sections.find(s => s.section_key === 'ads_content');
  const quickActionsSection = sections.find(s => s.section_key === 'quick_actions');
  const adsSidebarSection = sections.find(s => s.section_key === 'ads_sidebar');
  const statisticsSection = sections.find(s => s.section_key === 'statistics');
  const adsSidebar2Section = sections.find(s => s.section_key === 'ads_sidebar_2');

  // Fallback if no sections loaded yet
  if (sections.length === 0) {
    return (
      <div className="min-h-screen">
        <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
        <main className="container mx-auto px-6 py-12 space-y-16">
          <LiveUrgentAlerts />
          <HeroSection />
          <div className="flex justify-center"><AdSpace size="banner" position="header" /></div>
          <IslandSelector />
          <AnnouncementsSection />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <CategoriesSection />
              <div className="my-8 flex justify-center"><AdSpace size="medium" position="content" /></div>
            </div>
            <div className="space-y-8">
              <QuickActions />
              <AdSpace size="medium" position="sidebar" />
              {user && (isAdmin() || isModerator()) ? <StatisticsCard /> : null}
              <AdSpace size="small" position="sidebar" />
            </div>
          </div>
          <AIAssistantSection />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
      <main className="container mx-auto px-6 py-12 space-y-16">
        {mainSections.map(s => renderSection(s))}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            {categoriesSection?.is_visible && <CategoriesSection />}
            {adsContentSection?.is_visible && (
              <div className="my-8 flex justify-center"><AdSpace size="medium" position="content" /></div>
            )}
          </div>
          <div className="space-y-8">
            {quickActionsSection?.is_visible && <QuickActions />}
            {adsSidebarSection?.is_visible && <AdSpace size="medium" position="sidebar" />}
            {statisticsSection?.is_visible && user && (isAdmin() || isModerator()) && <StatisticsCard />}
            {adsSidebar2Section?.is_visible && <AdSpace size="small" position="sidebar" />}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
