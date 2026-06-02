import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import { Login } from "./pages/Login";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { FxRateProvider } from "@/contexts/FxRateContext";
import { PaymentTermsProvider } from "@/contexts/PaymentTermsContext";
import { InvoiceProvider } from "@/contexts/InvoiceContext";
import { ChaseProvider } from "@/contexts/ChaseContext";
import { AccountsProvider } from "@/hooks/useAccounts";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function ReadOnlyBanner() {
  const { canWrite, canRead } = useAuth();
  if (!canRead || canWrite) return null;
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-1.5 text-xs text-amber-700 dark:text-amber-400 text-center">
      Read-only access. Changes will be blocked. Ask an admin to upgrade your access level.
    </div>
  );
}

function AppRoutes() {
  const { session } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AccountsProvider>
              <FxRateProvider>
                <PaymentTermsProvider>
                  <InvoiceProvider>
                    <ChaseProvider>
                      <ReadOnlyBanner />
                      <Index />
                    </ChaseProvider>
                  </InvoiceProvider>
                </PaymentTermsProvider>
              </FxRateProvider>
            </AccountsProvider>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename="/enfactum-financing-hub">
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
