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

// Eagerly loaded: homepage
import Index from "./pages/Index";

// Lazy loaded: everything else
const FloatingChatbox = lazy(() => import("@/components/FloatingChatbox"));
const PushNotificationPrompt = lazy(() => import("@/components/PushNotificationPrompt"));
const WelcomeDialog = lazy(() => import("@/components/WelcomeDialog").then(m => ({ default: m.WelcomeDialog })));
const MaintenanceCheck = lazy(() => import("./components/MaintenanceCheck").then(m => ({ default: m.MaintenanceCheck })));

const PricesPage = lazy(() => import("./pages/PricesPage"));
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
const InstallPage = lazy(() => import("./pages/InstallPage"));
const DeleteAccountPage = lazy(() => import("./pages/DeleteAccountPage"));
const FreelancePage = lazy(() => import("./pages/FreelancePage"));
const FreelanceJobDetail = lazy(() => import("./pages/FreelanceJobDetail"));
const FreelancerDirectoryPage = lazy(() => import("./pages/FreelancerDirectoryPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const DiasporaPage = lazy(() => import("./pages/DiasporaPage"));
const DiasporaProjectDetail = lazy(() => import("./pages/DiasporaProjectDetail"));

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

// Auto-clear cache every 30 minutes
setInterval(() => {
  queryClient.invalidateQueries();
}, 30 * 60 * 1000);

const App = () => (
  <QueryClientProvider client={queryClient}>
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
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/forgot" element={<ResetPasswordRequest />} />
              <Route path="/auth/reset" element={<ResetPassword />} />
              <Route path="/prix" element={<PricesPage />} />
              <Route path="/evenements" element={<EventsPage />} />
              <Route path="/evenements/:id" element={<EventDetail />} />
              <Route path="/appels-offres" element={<TendersPage />} />
              <Route path="/appels-offres/:id" element={<ContentDetailPage contentType="tender" label="Appel d'offres" icon="📋" backPath="/appels-offres" />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/services/:id" element={<ContentDetailPage contentType="service" label="Service" icon="🏛️" backPath="/services" />} />
              <Route path="/annonces" element={<AnnouncementsPage />} />
              <Route path="/annonces/:id" element={<AnnouncementDetail />} />
              <Route path="/pro" element={<ProPage />} />
              <Route path="/page/:slug" element={<StaticPage />} />
              <Route path="/install" element={<InstallPage />} />
              <Route path="/supprimer-compte" element={<DeleteAccountPage />} />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute allowedRoles={['user', 'moderator', 'admin']}>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'moderator']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/annonceur" 
                element={
                  <ProtectedRoute allowedRoles={['annonceur', 'moderator', 'admin']}>
                    <AnnouncerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="/freelance" element={<FreelancePage />} />
              <Route path="/freelance/:id" element={<FreelanceJobDetail />} />
              <Route path="/freelancers" element={<FreelancerDirectoryPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/messages/:partnerId" element={<MessagesPage />} />
              <Route path="/investissement" element={<DiasporaPage />} />
              <Route path="/investissement/:id" element={<DiasporaProjectDetail />} />
              <Route path="/ile/:islandName" element={<IslandDetailPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <WelcomeDialog />
            <FloatingChatbox />
            <PushNotificationPrompt />
            {/* Maintenance check seulement en développement */}
            {import.meta.env.DEV && <MaintenanceCheck />}
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
