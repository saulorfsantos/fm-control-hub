import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ProcessProvider } from "@/contexts/ProcessContext";
import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import EscolaDashboard from "./pages/EscolaDashboard";
import EscolaChecklist from "./pages/EscolaChecklist";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <ProcessProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/escola" element={<DashboardLayout />}>
                <Route path="dashboard" element={<EscolaDashboard />} />
                <Route path="checklist" element={<EscolaChecklist />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>
              {/* Keep old route for compat */}
              <Route path="/dashboard" element={<Navigate to="/escola/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ProcessProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
