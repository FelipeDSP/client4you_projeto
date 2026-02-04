import { Suspense, lazy } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React from "react";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { PageTitleProvider } from "@/contexts/PageTitleContext";

// Lazy load das páginas para reduzir bundle inicial
const Login = lazy(() => import("./pages/Login"));
const LoginSecure = lazy(() => import("./pages/LoginSecure"));
const Signup = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const History = lazy(() => import("./pages/History"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Admin = lazy(() => import("./pages/Admin"));
const Disparador = lazy(() => import("./pages/Disparador"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Pricing = lazy(() => import("./pages/Pricing"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SearchLeads = lazy(() => import("./pages/SearchLeads"));
const SearchLeadsV2 = lazy(() => import("./pages/SearchLeadsV2"));
const LeadsLibrary = lazy(() => import("./pages/LeadsLibrary"));
const HistoryV2 = lazy(() => import("./pages/HistoryV2"));

// Componente de Loading para Suspense
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50">
    <div className="text-center space-y-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Para rotas admin, não fazemos verificação aqui
  // O próprio componente Admin fará a verificação
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// ... (imports existentes)

const AppRoutes = () => (
  <Routes>
    {/* Landing Page Pública */}
    <Route path="/" element={<LandingPage />} />
    
    <Route
      path="/login"
      element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      }
    />
    
    <Route
      path="/signup"
      element={
        <PublicRoute>
          <Signup />
        </PublicRoute>
      }
    />
    
    {/* Rota /pricing removida - agora só na landing page */}
    
    {/* Rotas Protegidas com Layout */}
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <MainLayout>
            <Dashboard />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
  path="/search"
  element={
    <ProtectedRoute>
      <MainLayout>
        <SearchLeadsV2 />
      </MainLayout>
    </ProtectedRoute>
  }
    />
    <Route
      path="/leads"
      element={
        <ProtectedRoute>
          <MainLayout>
            <History />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/history"
      element={
        <ProtectedRoute>
          <MainLayout>
            <History />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/profile"
      element={
        <ProtectedRoute>
          <MainLayout>
            <Profile />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings"
      element={
        <ProtectedRoute>
          <MainLayout>
            <Settings />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/disparador"
      element={
        <ProtectedRoute>
          <MainLayout>
            <Disparador />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin"
      element={
        <ProtectedRoute requireAdmin>
          <MainLayout>
            <Admin />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

// ... (resto do código)

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <SubscriptionProvider>
            <PageTitleProvider>
              <Toaster />
              <Sonner />
              <Suspense fallback={<PageLoader />}>
                <AppRoutes />
              </Suspense>
            </PageTitleProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
