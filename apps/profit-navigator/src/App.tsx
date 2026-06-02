import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useDataStoreProvider, DataStoreProvider } from "@/hooks/useDataStore";
import { AuthProvider } from "@/hooks/useAuth";
import { SupabaseAuthProvider, useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { CurrencyProvider } from "@/hooks/useCurrency";
import { SplashScreen } from "@/components/SplashScreen";
import { ErrorBoundary } from "@repo/ui/error-boundary";
import { PageLoader } from "@/components/PageLoader";
import AppLayout from "./components/AppLayout";

const Dashboard = React.lazy(() => import("./pages/Index"));
const ProjectsPage = React.lazy(() => import("./pages/ProjectsPage"));
const ProjectDetail = React.lazy(() => import("./pages/ProjectDetail"));
const ClientsPage = React.lazy(() => import("./pages/ClientsPage"));
const FinanceQuickAccess = React.lazy(() => import("./pages/FinanceQuickAccess"));
const ValidationPage = React.lazy(() => import("./pages/ValidationPage"));
const SettingsPage = React.lazy(() => import("./pages/SettingsPage"));
const AnalyticsPage = React.lazy(() => import("./pages/AnalyticsPage"));
const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function NotInEmployeeDirectory() {
  const { signOut, user } = useSupabaseAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-xl font-semibold">Account not authorized</h1>
        <p className="text-sm text-muted-foreground">
          {user?.email ?? "This account"} is signed in but is not on the
          Profit Navigator access list. Ask an admin to add you to the employees
          directory, then sign in again.
        </p>
        <button
          onClick={signOut}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function ProtectedShell() {
  const { session, employee, loading } = useSupabaseAuth();

  if (loading) return <PageLoader />;
  if (!session) return <Navigate to="/login" replace />;
  if (!employee) return <NotInEmployeeDirectory />;

  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  const { employee, accessLevel } = useSupabaseAuth();
  const store = useDataStoreProvider();

  return (
    <AuthProvider employee={employee} accessLevel={accessLevel}>
      <DataStoreProvider value={store}>
        <CurrencyProvider>
          <ErrorBoundary fallbackTitle="An unexpected error occurred. Please refresh the page.">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/:id" element={<ProjectDetail />} />
                  <Route path="/clients" element={<ClientsPage />} />
                  <Route path="/finance" element={<FinanceQuickAccess />} />
                  <Route path="/validation" element={<ValidationPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </CurrencyProvider>
      </DataStoreProvider>
    </AuthProvider>
  );
}

function LoginGate() {
  const { session, loading } = useSupabaseAuth();
  if (loading) return <PageLoader />;
  if (session) return <Navigate to="/" replace />;
  return (
    <Suspense fallback={<PageLoader />}>
      <LoginPage />
    </Suspense>
  );
}

function AppInner() {
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename="/profit-navigator">
        <SupabaseAuthProvider>
          <Routes>
            <Route path="/login" element={<LoginGate />} />
            <Route path="/*" element={<ProtectedShell />} />
          </Routes>
        </SupabaseAuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <SplashScreen>
        <AppInner />
      </SplashScreen>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
