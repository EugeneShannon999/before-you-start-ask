import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import PolicyCenter from "./pages/PolicyCenter";
import PolicyDetail from "./pages/PolicyDetail";
import PolicySubscription from "./pages/PolicySubscription";
import Calculator from "./pages/Calculator";
import PluginManagement from "./pages/PluginManagement";
import MarketInfo from "./pages/MarketInfo";
import Prediction from "./pages/Prediction";
import TradeCalendar from "./pages/TradeCalendar";
import Trading from "./pages/Trading";
import AccountSettings from "./pages/AccountSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/ai/policy" replace />} />
            <Route path="/ai/policy" element={<PolicyCenter />} />
            <Route path="/ai/policy/subscription" element={<PolicySubscription />} />
            <Route path="/ai/policy/:id" element={<PolicyDetail />} />
            <Route path="/tools/market" element={<MarketInfo />} />
            <Route path="/tools/prediction" element={<Prediction />} />
            <Route path="/tools/calculator" element={<Calculator />} />
            <Route path="/tools/calendar" element={<TradeCalendar />} />
            <Route path="/tools/trading" element={<Trading />} />
            <Route path="/system/plugin" element={<PluginManagement />} />
            <Route path="/system/account" element={<AccountSettings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
