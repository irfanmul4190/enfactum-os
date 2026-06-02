import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import Activities from "./pages/Activities";
import Partners from "./pages/Partners";
import Clients from "./pages/Clients";
import Vendors from "./pages/Vendors";
import POE from "./pages/POE";
import Creatives from "./pages/Creatives";
import Financials from "./pages/Financials";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import Resources from "./pages/Resources";
import MDFPipeline from "./pages/MDFPipeline";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename="/enfactum-mdf-central">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/projects/:id" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
            <Route path="/activities/:id" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
            <Route path="/partners" element={<ProtectedRoute><Partners /></ProtectedRoute>} />
            <Route path="/partners/:id" element={<ProtectedRoute><Partners /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
            <Route path="/vendors" element={<ProtectedRoute><Vendors /></ProtectedRoute>} />
            <Route path="/poe" element={<ProtectedRoute><POE /></ProtectedRoute>} />
            <Route path="/creatives" element={<ProtectedRoute><Creatives /></ProtectedRoute>} />
            <Route path="/financials" element={<ProtectedRoute><Financials /></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
            <Route path="/mdf-pipeline" element={<ProtectedRoute><MDFPipeline /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
