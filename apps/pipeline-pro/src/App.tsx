import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { EmployeeProvider } from "@/contexts/EmployeeContext";
import { AppLayout } from "@/components/AppLayout";
const FunnelAnalytics   = lazy(() => import("./pages/FunnelAnalytics"));
const DocumentLibrary   = lazy(() => import("./pages/DocumentLibrary"));


// Login page kept eager — it's the first thing unauthenticated users see.
// Everything else is split into its own chunk via React.lazy. NotFound is
// also eager because it's tiny and used as the fallback route.
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const Dashboard         = lazy(() => import("./pages/Dashboard"));
const Pipeline          = lazy(() => import("./pages/Pipeline"));
const OpportunityDetail = lazy(() => import("./pages/OpportunityDetail"));
const Accounts          = lazy(() => import("./pages/Accounts"));
const AccountDetail     = lazy(() => import("./pages/AccountDetail"));
const PitchLibrary      = lazy(() => import("./pages/PitchLibrary"));
const ClientDocuments   = lazy(() => import("./pages/ClientDocuments"));
const Reports           = lazy(() => import("./pages/Reports"));
const AdminSettings     = lazy(() => import("./pages/AdminSettings"));
const ImportTool        = lazy(() => import("./pages/ImportTool"));

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const queryClient = new QueryClient();

function ProtectedRoute({
  children,
  requireAdmin,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { session, loading, canAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !canAdmin) {
    return <Navigate to="/" replace />;
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
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const wrap = (child: React.ReactNode, opts?: { requireAdmin?: boolean }) => (
    <ProtectedRoute requireAdmin={opts?.requireAdmin}>
      <AppLayout>
        <ReadOnlyBanner />
        {child}
      </AppLayout>
    </ProtectedRoute>
  );

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={wrap(<Dashboard />)} />
        <Route path="/pipeline" element={wrap(<Pipeline />)} />
        <Route path="/opportunity/:id" element={wrap(<OpportunityDetail />)} />
        <Route path="/accounts" element={wrap(<Accounts />)} />
        <Route path="/accounts/:id" element={wrap(<AccountDetail />)} />
        <Route path="/pitch-library" element={wrap(<PitchLibrary />)} />
        <Route path="/documents" element={wrap(<ClientDocuments />)} />
        <Route path="/reports" element={wrap(<Reports />)} />
        <Route path="/admin" element={wrap(<AdminSettings />, { requireAdmin: true })} />
        <Route path="/admin/import" element={wrap(<ImportTool />, { requireAdmin: true })} />
        <Route path="*" element={<NotFound />} />
        <Route path="/funnel-analytics" element={wrap(<FunnelAnalytics />)} />
        <Route path="/document-library" element={wrap(<DocumentLibrary />)} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <EmployeeProvider>
          <BrowserRouter basename="/pipeline-pro">
            <AppRoutes />
          </BrowserRouter>
        </EmployeeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
