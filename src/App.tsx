import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { CalculatorShell } from "@/components/layout/CalculatorShell";
import { ProvinceProvider } from "@/contexts/ProvinceContext";
import PolicyCenter from "./pages/PolicyCenter";
import PolicyDetail from "./pages/PolicyDetail";
import SessionsView from "./pages/SessionsView";
import PoliciesListView from "./pages/PoliciesListView";

import CustomersPage from "./pages/calculator/CustomersPage";
import RunsPage from "./pages/calculator/RunsPage";
import RunResultPage from "./pages/calculator/RunResultPage";
import PoliciesPage from "./pages/calculator/PoliciesPage";
import BatchesPage from "./pages/calculator/BatchesPage";

import PluginManagement from "./pages/PluginManagement";
import MarketInfo from "./pages/MarketInfo";
import ChartFullscreen from "./pages/market/ChartFullscreen";
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
        <ProvinceProvider>
        <Routes>
          {/* 图表大屏 - 独立页面，无侧边栏 */}
          <Route path="/tools/market/chart/:chartId" element={<ChartFullscreen />} />

          {/* 主应用 - 带侧边栏 */}
          <Route
            path="*"
            element={
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/ai/policy" replace />} />
                  <Route path="/ai/policy" element={<PolicyCenter />} />
                  <Route path="/ai/policy/:id" element={<PolicyDetail />} />
                  <Route path="/ai/sessions" element={<SessionsView />} />
                  <Route path="/ai/policies" element={<PoliciesListView />} />
                  <Route path="/tools/market" element={<MarketInfo />} />
                  <Route path="/tools/prediction" element={<Prediction />} />

                  {/* 结算计算器 - 两栏布局：左侧全局导航 + 右侧主内容（顶部 tabs） */}
                  <Route
                    path="/tools/calculator"
                    element={<Navigate to="/tools/calculator/customers" replace />}
                  />
                  <Route
                    path="/tools/calculator/customers"
                    element={<CalculatorShell><CustomersPage /></CalculatorShell>}
                  />
                  <Route
                    path="/tools/calculator/runs"
                    element={<CalculatorShell><RunsPage /></CalculatorShell>}
                  />
                  <Route
                    path="/tools/calculator/runs/:runId/results"
                    element={<CalculatorShell inner><RunResultPage /></CalculatorShell>}
                  />
                  <Route
                    path="/tools/calculator/policies"
                    element={<CalculatorShell><PoliciesPage /></CalculatorShell>}
                  />
                  <Route
                    path="/tools/calculator/batches"
                    element={<CalculatorShell><BatchesPage /></CalculatorShell>}
                  />

                  <Route path="/tools/calendar" element={<TradeCalendar />} />
                  <Route path="/tools/trading" element={<Trading />} />
                  <Route path="/system/plugin" element={<PluginManagement />} />
                  <Route path="/system/account" element={<AccountSettings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            }
          />
        </Routes>
        </ProvinceProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
