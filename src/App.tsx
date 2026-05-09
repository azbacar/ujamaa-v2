import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/components/LanguageProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DynamicFavicon } from "@/components/DynamicFavicon";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import ScrollToTop from "./components/ScrollToTop";
import { useDatasetStaleListener } from "@/hooks/useDatasetStaleListener";

// Eagerly loaded: homepage
import Index from "./pages/Index";

// Lazy loaded: everything else
const FloatingChatbox = lazy(() => import("@/components/FloatingChatbox"));
const ActiveShareBar = lazy(() => import("@/components/ActiveShareBar"));

const WelcomeDialog = lazy(() => import("@/components/WelcomeDialog").then(m => ({ default: m.WelcomeDialog })));
const MaintenanceCheck = lazy(() => import("./components/MaintenanceCheck").then(m => ({ default: m.MaintenanceCheck })));

const PricesPage = lazy(() => import("./pages/PricesPage"));
const PriceDetailPage = lazy(() => import("./pages/PriceDetailPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const TendersPage = lazy(() => import("./pages/TendersPage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const ContentDetailPage = lazy(() => import("./pages/ContentDetailPage"));
const AnnouncementsPage = lazy(() => import("./pages/AnnouncementsPage"));
const AnnouncementDetail = lazy(() => import("./pages/AnnouncementDetail"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const IslandDetailPage = lazy(() => import("./pages/IslandDetailPage"));
const AnnouncerDashboard = lazy(() => import("./pages/AnnouncerDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ResetPasswordRequest = lazy(() => import("./pages/ResetPasswordRequest"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ProPage = lazy(() => import("./pages/ProPage"));
const StaticPage = lazy(() => import("./pages/StaticPage"));

const DeleteAccountPage = lazy(() => import("./pages/DeleteAccountPage"));
const FreelancePage = lazy(() => import("./pages/FreelancePage"));
const FreelanceJobDetail = lazy(() => import("./pages/FreelanceJobDetail"));
const FreelancerDirectoryPage = lazy(() => import("./pages/FreelancerDirectoryPage"));
const FreelancerProfilePage = lazy(() => import("./pages/FreelancerProfilePage"));
const FreelancerCRMPage = lazy(() => import("./pages/FreelancerCRMPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const InvestPage = lazy(() => import("./pages/InvestPage"));
const InvestProjectDetail = lazy(() => import("./pages/InvestProjectDetail"));
const EnterpriseDashboard = lazy(() => import("./pages/EnterpriseDashboard"));
const TourismePage = lazy(() => import("./pages/TourismePage"));
const InfosPratiquesPage = lazy(() => import("./pages/InfosPratiquesPage"));
const GuidePage = lazy(() => import("./pages/GuidePage"));
const VendorMapPage = lazy(() => import("./pages/VendorMapPage"));
const PartnerPage = lazy(() => import("./pages/PartnerPage"));
const ApiDocsPage = lazy(() => import("./pages/ApiDocsPage"));
const MobileBottomNav = lazy(() => import("./components/MobileBottomNav"));
const DeepLinkRedirect = lazy(() => import("./components/DeepLinkRedirect"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-muted-foreground text-sm">Chargement…</div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});


const AppShell = ({ children }: { children: React.ReactNode }) => {
  useDatasetStaleListener();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppShell>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <DynamicFavicon />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <GoogleAnalytics />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Suspense fallback={<PageLoader />}><AuthPage /></Suspense>} />
              <Route path="/auth/forgot" element={<Suspense fallback={<PageLoader />}><ResetPasswordRequest /></Suspense>} />
              <Route path="/auth/reset" element={<Suspense fallback={<PageLoader />}><ResetPassword /></Suspense>} />
              <Route path="/prix" element={<Suspense fallback={<PageLoader />}><PricesPage /></Suspense>} />
              <Route path="/prix/:id" element={<Suspense fallback={<PageLoader />}><PriceDetailPage /></Suspense>} />
              <Route path="/evenements" element={<Suspense fallback={<PageLoader />}><EventsPage /></Suspense>} />
              <Route path="/evenements/:id" element={<Suspense fallback={<PageLoader />}><EventDetail /></Suspense>} />
              <Route path="/appels-offres" element={<Suspense fallback={<PageLoader />}><TendersPage /></Suspense>} />
              <Route path="/appels-offres/:id" element={<Suspense fallback={<PageLoader />}><ContentDetailPage contentType="tender" label="Appel d'offres" icon="📋" backPath="/appels-offres" /></Suspense>} />
              <Route path="/services" element={<Suspense fallback={<PageLoader />}><ServicesPage /></Suspense>} />
              <Route path="/services/:id" element={<Suspense fallback={<PageLoader />}><ContentDetailPage contentType="service" label="Service" icon="🏛️" backPath="/services" /></Suspense>} />
              <Route path="/annonces" element={<Suspense fallback={<PageLoader />}><AnnouncementsPage /></Suspense>} />
              <Route path="/annonces/:id" element={<Suspense fallback={<PageLoader />}><AnnouncementDetail /></Suspense>} />
              <Route path="/pro" element={<Suspense fallback={<PageLoader />}><ProPage /></Suspense>} />
              <Route path="/page/:slug" element={<Suspense fallback={<PageLoader />}><StaticPage /></Suspense>} />
              
              <Route path="/supprimer-compte" element={<Suspense fallback={<PageLoader />}><DeleteAccountPage /></Suspense>} />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute allowedRoles={['user', 'annonceur', 'moderator', 'admin']}>
                    <Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'moderator']}>
                    <Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/annonceur" 
                element={
                  <ProtectedRoute allowedRoles={['annonceur', 'moderator', 'admin']}>
                    <Suspense fallback={<PageLoader />}><AnnouncerDashboard /></Suspense>
                  </ProtectedRoute>
                } 
              />
              <Route path="/freelance" element={<Suspense fallback={<PageLoader />}><FreelancePage /></Suspense>} />
              <Route path="/freelance/:id" element={<Suspense fallback={<PageLoader />}><FreelanceJobDetail /></Suspense>} />
              <Route path="/freelancers" element={<Suspense fallback={<PageLoader />}><FreelancerDirectoryPage /></Suspense>} />
              <Route path="/freelancer/:id" element={<Suspense fallback={<PageLoader />}><FreelancerProfilePage /></Suspense>} />
              <Route path="/freelancer-crm" element={<Suspense fallback={<PageLoader />}><FreelancerCRMPage /></Suspense>} />
              <Route path="/messages" element={<Suspense fallback={<PageLoader />}><MessagesPage /></Suspense>} />
              <Route path="/messages/:partnerId" element={<Suspense fallback={<PageLoader />}><MessagesPage /></Suspense>} />
              <Route path="/investissement" element={<Suspense fallback={<PageLoader />}><InvestPage /></Suspense>} />
              <Route path="/investissement/:id" element={<Suspense fallback={<PageLoader />}><InvestProjectDetail /></Suspense>} />
              <Route 
                path="/entreprise" 
                element={
                  <ProtectedRoute allowedRoles={['user', 'annonceur', 'moderator', 'admin']}>
                    <Suspense fallback={<PageLoader />}><EnterpriseDashboard /></Suspense>
                  </ProtectedRoute>
                } 
              />
              <Route path="/tourisme" element={<Suspense fallback={<PageLoader />}><TourismePage /></Suspense>} />
              <Route path="/infos-pratiques" element={<Suspense fallback={<PageLoader />}><InfosPratiquesPage /></Suspense>} />
              <Route path="/ile/:islandName" element={<Suspense fallback={<PageLoader />}><IslandDetailPage /></Suspense>} />
              <Route path="/guide" element={<Suspense fallback={<PageLoader />}><GuidePage /></Suspense>} />
              <Route path="/carte-vendeurs" element={<Suspense fallback={<PageLoader />}><VendorMapPage /></Suspense>} />
              <Route path="/partener" element={<Suspense fallback={<PageLoader />}><PartnerPage /></Suspense>} />
              <Route path="/api-docs" element={<Suspense fallback={<PageLoader />}><ApiDocsPage /></Suspense>} />

              {/* Deep-links courts (notifications push, SMS, partages externes) */}
              <Route path="/p/:id" element={<Suspense fallback={<PageLoader />}><DeepLinkRedirect prefix="p" /></Suspense>} />
              <Route path="/e/:id" element={<Suspense fallback={<PageLoader />}><DeepLinkRedirect prefix="e" /></Suspense>} />
              <Route path="/ao/:id" element={<Suspense fallback={<PageLoader />}><DeepLinkRedirect prefix="ao" /></Suspense>} />
              <Route path="/s/:id" element={<Suspense fallback={<PageLoader />}><DeepLinkRedirect prefix="s" /></Suspense>} />
              <Route path="/a/:id" element={<Suspense fallback={<PageLoader />}><DeepLinkRedirect prefix="a" /></Suspense>} />
              <Route path="/i/:id" element={<Suspense fallback={<PageLoader />}><DeepLinkRedirect prefix="i" /></Suspense>} />
              <Route path="/f/:id" element={<Suspense fallback={<PageLoader />}><DeepLinkRedirect prefix="f" /></Suspense>} />

              <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
            </Routes>
            <Suspense fallback={null}>
              <WelcomeDialog />
              <FloatingChatbox />
              <MobileBottomNav />
            </Suspense>
            {import.meta.env.DEV && (
              <Suspense fallback={null}>
                <MaintenanceCheck />
              </Suspense>
            )}
            <Suspense fallback={null}>
              <ActiveShareBar />
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
    </AppShell>
  </QueryClientProvider>
);

export default App;
