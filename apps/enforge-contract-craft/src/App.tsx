import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { EmployeeProvider } from "@/hooks/useEmployee";
import { AppLayout } from "@/components/AppLayout";
import Login from "@/pages/Login";
import Index from "@/pages/Index";
import Contracts from "@/pages/Contracts";
import ContractNew from "@/pages/ContractNew";
import ContractDetail from "@/pages/ContractDetail";
import Templates from "@/pages/Templates";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  return (
    <EmployeeProvider>
      <AppLayout />
    </EmployeeProvider>
  );
}

function LoginRoute() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/" replace />;
  return <Login />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename="/enforge-contract-craft">
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route element={<ProtectedRoutes />}>
              <Route path="/" element={<Index />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/contracts/new" element={<ContractNew />} />
              <Route path="/contracts/:id" element={<ContractDetail />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
