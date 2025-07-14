import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import PricesPage from "./pages/PricesPage";
import EventsPage from "./pages/EventsPage";
import TendersPage from "./pages/TendersPage";
import ServicesPage from "./pages/ServicesPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import AnnouncementDetail from "./pages/AnnouncementDetail";
import EventDetail from "./pages/EventDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/prix" element={<PricesPage />} />
          <Route path="/evenements" element={<EventsPage />} />
          <Route path="/evenements/:id" element={<EventDetail />} />
          <Route path="/appels-offres" element={<TendersPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/annonces" element={<AnnouncementsPage />} />
          <Route path="/annonce/:id" element={<AnnouncementDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
