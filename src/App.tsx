import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ProcessProvider } from "@/contexts/ProcessContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import AdminLayout from "./components/AdminLayout";
import EscolaDashboard from "./pages/EscolaDashboard";
import EscolaChecklist from "./pages/EscolaChecklist";
import EscolaFinanceiro from "./pages/EscolaFinanceiro";
import EscolaConselho from "./pages/EscolaConselho";
import AdminEscolas from "./pages/AdminEscolas";
import AdminEscolaDetalhe from "./pages/AdminEscolaDetalhe";
import NotFound from "./pages/NotFound";

const RootRedirect = () => {
  const { profile, loading } = useAuth();
  
  if (loading) return null;
  
  if (profile?.role === 'forte_mais_admin') {
    return <Navigate to="/admin/escolas" replace />;
  } else if (profile?.role === 'school_user') {
    return <Navigate to="/escola/dashboard" replace />;
  }
  
  return <Navigate to="/login" replace />;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <ProcessProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/login" element={<Login />} />
                
                <Route element={<ProtectedRoute allowedRoles={['school_user']} />}>
                  <Route path="/escola" element={<DashboardLayout />}>
                    <Route path="dashboard" element={<EscolaDashboard />} />
                    <Route path="checklist" element={<EscolaChecklist />} />
                    <Route path="financeiro" element={<EscolaFinanceiro />} />
                    <Route path="conselho" element={<EscolaConselho />} />
                    <Route index element={<Navigate to="dashboard" replace />} />
                  </Route>
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['forte_mais_admin']} />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route path="escolas" element={<AdminEscolas />} />
                    <Route path="escola/:schoolId" element={<AdminEscolaDetalhe />} />
                    <Route index element={<Navigate to="escolas" replace />} />
                  </Route>
                </Route>
              {/* Keep old route for compat */}
              <Route path="/dashboard" element={<Navigate to="/escola/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ProcessProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
