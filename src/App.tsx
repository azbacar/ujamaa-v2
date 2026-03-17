import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/components/LanguageProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import FloatingChatbox from "@/components/FloatingChatbox";
import PushNotificationPrompt from "@/components/PushNotificationPrompt";
import Index from "./pages/Index";
import PricesPage from "./pages/PricesPage";
import EventsPage from "./pages/EventsPage";
import TendersPage from "./pages/TendersPage";
import ServicesPage from "./pages/ServicesPage";
import ContentDetailPage from "./pages/ContentDetailPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import AnnouncementDetail from "./pages/AnnouncementDetail";
import EventDetail from "./pages/EventDetail";
import AdminDashboard from "./pages/AdminDashboard";

import IslandDetailPage from "./pages/IslandDetailPage";
import AnnouncerDashboard from "./pages/AnnouncerDashboard";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import ResetPasswordRequest from "./pages/ResetPasswordRequest";
import ResetPassword from "./pages/ResetPassword";
import ProfilePage from "./pages/ProfilePage";
import ProPage from "./pages/ProPage";
import StaticPage from "./pages/StaticPage";
import InstallPage from "./pages/InstallPage";
import DeleteAccountPage from "./pages/DeleteAccountPage";
import { MaintenanceCheck } from "./components/MaintenanceCheck";
import ScrollToTop from "./components/ScrollToTop";
import FreelancePage from "./pages/FreelancePage";
import FreelanceJobDetail from "./pages/FreelanceJobDetail";
import FreelancerDirectoryPage from "./pages/FreelancerDirectoryPage";
import MessagesPage from "./pages/MessagesPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Désactiver le refetch automatique pour éviter la perte de données saisies
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
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
              <Route path="/ile/:islandName" element={<IslandDetailPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
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
