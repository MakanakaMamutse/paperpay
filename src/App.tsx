
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import AppDashboard from "./pages/AppDashboard";
import Auth from "./pages/Auth";
import UserDashboard from "./pages/UserDashboard";
import VendorDashboard from "./pages/VendorDashboard";
import QRScanner from "./pages/QRScanner";
import WalletSetup from "./pages/WalletSetup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<AppDashboard />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/user-dashboard" element={<UserDashboard />} />
          <Route path="/vendor-dashboard" element={<VendorDashboard />} />
          <Route path="/qr-scanner" element={<QRScanner />} />
          <Route path="/wallet-setup" element={<WalletSetup />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
