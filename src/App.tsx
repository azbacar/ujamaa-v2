import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/components/LanguageProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import FloatingChatbox from "@/components/FloatingChatbox";
import Index from "./pages/Index";
import PricesPage from "./pages/PricesPage";
import EventsPage from "./pages/EventsPage";
import TendersPage from "./pages/TendersPage";
import ServicesPage from "./pages/ServicesPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import AnnouncementDetail from "./pages/AnnouncementDetail";
import EventDetail from "./pages/EventDetail";
import AdminDashboard from "./pages/AdminDashboard";
import IslandDetailPage from "./pages/IslandDetailPage";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import ResetPasswordRequest from "./pages/ResetPasswordRequest";
import ResetPassword from "./pages/ResetPassword";
import ProfilePage from "./pages/ProfilePage";
import { MaintenanceCheck } from "./components/MaintenanceCheck";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/forgot" element={<ResetPasswordRequest />} />
              <Route path="/auth/reset" element={<ResetPassword />} />
              <Route path="/prix" element={<PricesPage />} />
              <Route path="/evenements" element={<EventsPage />} />
              <Route path="/evenements/:id" element={<EventDetail />} />
              <Route path="/appels-offres" element={<TendersPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/annonces" element={<AnnouncementsPage />} />
              <Route path="/annonces/:id" element={<AnnouncementDetail />} />
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
              <Route path="/ile/:islandName" element={<IslandDetailPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <FloatingChatbox />
            <MaintenanceCheck />
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
