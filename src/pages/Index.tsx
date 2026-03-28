import { useState, useEffect, lazy, Suspense } from 'react';
import Header from '@/components/Header';
import { useLanguage } from '@/components/LanguageProvider';
import HeroSection from '@/components/HeroSection';
import LiveStatsBar from '@/components/LiveStatsBar';
import AdSpace from '@/components/AdSpace';
import LiveUrgentAlerts from '@/components/LiveUrgentAlerts';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { usePageSEO } from '@/hooks/usePageSEO';
import { useJsonLd } from '@/hooks/useJsonLd';
import {
  StatsBarSkeleton,
  IslandsSkeleton,
  AnnouncementsSkeleton,
  CategoriesSkeleton,
  SidebarSkeleton,
} from '@/components/HomepageSkeleton';

const IslandSelector = lazy(() => import('@/components/IslandSelector'));
const AnnouncementsSection = lazy(() => import('@/components/AnnouncementsSection'));
const CategoriesSection = lazy(() => import('@/components/CategoriesSection'));
const RecentContentSection = lazy(() => import('@/components/RecentContentSection'));
const QuickActions = lazy(() => import('@/components/QuickActions'));
const StatisticsCard = lazy(() => import('@/components/StatisticsCard'));

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
    return section ? section.is_visible : true;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
      
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6">
        {/* Urgent alerts */}
        {isSectionVisible('alerts') && <LiveUrgentAlerts />}

        {/* Hero */}
        {isSectionVisible('hero') && <HeroSection />}

        {/* Live stats */}
        <LiveStatsBar />

        {/* Ad banner */}
        {isSectionVisible('ads_header') && (
          <div className="flex justify-center">
            <AdSpace size="banner" position="header" />
          </div>
        )}

        {/* Islands - compact */}
        {isSectionVisible('islands') && <IslandSelector />}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
          {/* Main content */}
          <div className="lg:col-span-8 space-y-5 sm:space-y-6">
            {/* Announcements */}
            {isSectionVisible('announcements') && <AnnouncementsSection />}

            {/* Categories */}
            {isSectionVisible('categories') && <CategoriesSection />}

            {/* Content ad */}
            {isSectionVisible('ads_content') && (
              <div className="flex justify-center">
                <AdSpace size="medium" position="content" />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-5">
            <RecentContentSection />

            {isSectionVisible('quick_actions') && <QuickActions />}

            {isSectionVisible('ads_sidebar') && <AdSpace size="medium" position="sidebar" />}

            {isSectionVisible('statistics') && user && (isAdmin() || isModerator()) && <StatisticsCard />}

            {isSectionVisible('ads_sidebar_2') && <AdSpace size="small" position="sidebar" />}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
