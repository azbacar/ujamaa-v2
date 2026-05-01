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
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Calendar, Briefcase, Globe, Map, Stethoscope } from 'lucide-react';

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

const serviceCards = [
  { icon: TrendingUp, label: 'Prix & Marchés', desc: 'Comparez les prix en temps réel', to: '/prix', color: 'from-emerald-500 to-emerald-600' },
  { icon: Calendar, label: 'Événements', desc: 'Agenda culturel et professionnel', to: '/evenements', color: 'from-ocean-500 to-ocean-600' },
  { icon: Briefcase, label: 'Appels d\'offres', desc: 'Marchés publics et privés', to: '/appels-offres', color: 'from-amber-500 to-amber-600' },
  { icon: Globe, label: 'Investissement', desc: 'Projets & levée de fonds', to: '/investissement', color: 'from-blue-500 to-blue-600' },
  { icon: Map, label: 'Info Pratique', desc: 'Taxis, pharmacies de garde', to: '/infos-pratiques', color: 'from-purple-500 to-purple-600' },
  { icon: Stethoscope, label: 'Services Publics', desc: 'Administrations & services', to: '/services', color: 'from-rose-500 to-rose-600' },
];

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
      
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">
        {/* Urgent alerts */}
        {isSectionVisible('alerts') && (
          <div className="animate-fade-in">
            <LiveUrgentAlerts />
          </div>
        )}

        {/* Hero */}
        {isSectionVisible('hero') && (
          <div className="animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
            <HeroSection />
          </div>
        )}

        {/* Live stats */}
        <div className="animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <LiveStatsBar />
        </div>

        {/* Services grid */}
        <div className="animate-fade-in" style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">🧭 Explorer</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {serviceCards.map((card) => (
              <Link key={card.to} to={card.to} className="group">
                <Card className="h-full border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2.5">
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                      <card.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-xs sm:text-sm text-foreground leading-tight">{card.label}</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">{card.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Ad banner */}
        {isSectionVisible('ads_header') && (
          <div className="flex justify-center animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            <AdSpace size="banner" position="header" />
          </div>
        )}

        {/* Islands */}
        {isSectionVisible('islands') && (
          <div className="animate-fade-in" style={{ animationDelay: '350ms', animationFillMode: 'both' }}>
            <Suspense fallback={<IslandsSkeleton />}>
              <IslandSelector />
            </Suspense>
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
          {/* Main content */}
          <div className="lg:col-span-8 space-y-6">
            {isSectionVisible('announcements') && (
              <div className="animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
                <Suspense fallback={<AnnouncementsSkeleton />}>
                  <AnnouncementsSection />
                </Suspense>
              </div>
            )}

            {isSectionVisible('categories') && (
              <div className="animate-fade-in" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
                <Suspense fallback={<CategoriesSkeleton />}>
                  <CategoriesSection />
                </Suspense>
              </div>
            )}

            {isSectionVisible('ads_content') && (
              <div className="flex justify-center animate-fade-in" style={{ animationDelay: '550ms', animationFillMode: 'both' }}>
                <AdSpace size="medium" position="content" />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-5">
            <div className="animate-fade-in" style={{ animationDelay: '450ms', animationFillMode: 'both' }}>
              <Suspense fallback={<SidebarSkeleton />}>
                <RecentContentSection />
              </Suspense>
            </div>

            {isSectionVisible('quick_actions') && (
              <div className="animate-fade-in" style={{ animationDelay: '550ms', animationFillMode: 'both' }}>
                <Suspense fallback={<SidebarSkeleton />}>
                  <QuickActions />
                </Suspense>
              </div>
            )}

            {isSectionVisible('ads_sidebar') && (
              <div className="animate-fade-in" style={{ animationDelay: '600ms', animationFillMode: 'both' }}>
                <AdSpace size="medium" position="sidebar" />
              </div>
            )}

            {isSectionVisible('statistics') && user && (isAdmin() || isModerator()) && (
              <div className="animate-fade-in" style={{ animationDelay: '650ms', animationFillMode: 'both' }}>
                <Suspense fallback={<SidebarSkeleton />}>
                  <StatisticsCard />
                </Suspense>
              </div>
            )}

            {isSectionVisible('ads_sidebar_2') && (
              <div className="animate-fade-in" style={{ animationDelay: '700ms', animationFillMode: 'both' }}>
                <AdSpace size="small" position="sidebar" />
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
