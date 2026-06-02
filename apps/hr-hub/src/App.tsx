import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { EncrewLayout } from "@/components/layout/EncrewLayout";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import Login from "@/pages/Login";

// Lazy-load every page so the initial bundle only ships layout + auth.
// Recharts (heaviest dep, ~380 KB) only enters the network when the user
// navigates to Dashboard or Utilization.
const Dashboard = lazy(() => import("@/pages/encrew/Dashboard"));
const PeopleList = lazy(() => import("@/pages/encrew/PeopleList"));
const EmployeeProfile = lazy(() => import("@/pages/encrew/EmployeeProfile"));
const AddEmployee = lazy(() => import("@/pages/encrew/AddEmployee"));
const SkillsMatrix = lazy(() => import("@/pages/encrew/SkillsMatrix"));
const Utilization = lazy(() => import("@/pages/encrew/Utilization"));
const Certifications = lazy(() => import("@/pages/encrew/Certifications"));
const EncrewSettings = lazy(() => import("@/pages/encrew/EncrewSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function ReadOnlyBanner() {
  const { canRead, canAdmin } = useAuth();
  // Writes on employees (the only mutable thing in HR Hub today) require
  // admin. So anyone with read-only or write access sees the banner.
  if (!canRead || canAdmin) return null;
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-1.5 text-xs text-amber-700 dark:text-amber-400 text-center">
      Read-only access. Changes will be blocked. Ask an HR-Hub admin to upgrade your access.
    </div>
  );
}

const PageFallback = () => (
  <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
    Loading…
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename="/hr-hub">
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={
                <ProtectedRoute>
                  <ReadOnlyBanner />
                  <EncrewLayout />
                </ProtectedRoute>
              }>
                <Route path="/" element={<Dashboard />} />
                <Route path="/people" element={<PeopleList />} />
                <Route path="/people/new" element={<AddEmployee />} />
                <Route path="/people/:id" element={<EmployeeProfile />} />
                <Route path="/people/:id/edit" element={<AddEmployee />} />
                <Route path="/skills" element={<SkillsMatrix />} />
                <Route path="/utilization" element={<Utilization />} />
                <Route path="/certifications" element={<Certifications />} />
                <Route path="/settings" element={<EncrewSettings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
