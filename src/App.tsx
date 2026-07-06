import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route, Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/auth-context';
import { ProtectedRoute } from './components/protected-route';
import { DashboardLayout } from './layout/dashboard-layout';
import { useTheme } from 'next-themes';
import { ResponsiveToaster } from '@/components/ui/responsive-toaster';

import { PageLoader } from './components/common/page-loader';
import { lazyRetry } from './utils/lazy-retry';
import { ErrorBoundary, ErrorPage } from './components/common/error-boundary';
import { supabase } from './lib/supabaseClient';
import { MaintenancePage } from './components/common/maintenance-page';

const HabitsPage = lazyRetry(() => import('./features/habits/habits-page').then(m => ({ default: m.HabitsPage })));
const GoalsPage = lazyRetry(() => import('./features/goals/goals-page').then(m => ({ default: m.GoalsPage })));
const PlannerPage = lazyRetry(() => import('./features/planner/planner-page').then(m => ({ default: m.PlannerPage })));
const TodayPage = lazyRetry(() => import('./features/today/today-page').then(m => ({ default: m.TodayPage })));
const LoginPage = lazyRetry(() => import('./features/auth/login-page').then(m => ({ default: m.LoginPage })));
const SignupPage = lazyRetry(() => import('./features/auth/signup-page').then(m => ({ default: m.SignupPage })));
const ProfilePage = lazyRetry(() => import('./features/profile/profile-page').then(m => ({ default: m.ProfilePage })));
const StatisticsPage = lazyRetry(() => import('./features/statistics/statistics-page').then(m => ({ default: m.StatisticsPage })));
const StatsCalculationsPage = lazyRetry(() => import('./features/statistics/calculations-page').then(m => ({ default: m.StatsCalculationsPage })));
const VaultPage = lazyRetry(() => import('./features/vault/vault-page').then(m => ({ default: m.VaultPage })));
const ForgotPasswordPage = lazyRetry(() => import('./features/auth/forgot-password-page').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazyRetry(() => import('./features/auth/reset-password-page').then(m => ({ default: m.ResetPasswordPage })));
const LandingPage = lazyRetry(() => import('./features/(public)/landing-page').then(m => ({ default: m.LandingPage })));
const AdminPage = lazyRetry(() => import('./features/admin/admin-page').then(m => ({ default: m.AdminPage })));
const PrivacyPage = lazyRetry(() => import('./features/(public)/privacy-page').then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazyRetry(() => import('./features/(public)/terms-page').then(m => ({ default: m.TermsPage })));
const RefundPage = lazyRetry(() => import('./features/(public)/refund-page').then(m => ({ default: m.RefundPage })));
const SimulatorPage = lazyRetry(() => import('./features/simulator/simulator-page').then(m => ({ default: m.SimulatorPage })));


const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

const HomeRoute = () => {
  const { user, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const bypass = searchParams.get('bypass') === 'true';

  React.useEffect(() => {
    if (user) {
      localStorage.setItem('has_logged_in', 'true');
    }
  }, [user]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (user) {
    return <Navigate to="/today" replace />;
  }

  if (!bypass && localStorage.getItem('has_logged_in') === 'true') {
    return <Navigate to="/login" replace />;
  }

  return <SuspenseWrapper><LandingPage /></SuspenseWrapper>;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes cache to make navigation instant
      gcTime: 10 * 60 * 1000, // 10 minutes before garbage collected
    },
  },
});

const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const MaintenanceGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = React.useState<boolean | null>(null);
  const [dbError, setDbError] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const location = window.location;

  React.useEffect(() => {
    let active = true;
    const fetchMaintenanceStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("landing_page_settings")
          .select("maintenance_mode")
          .eq("id", 1)
          .maybeSingle();

        if (!active) return;

        if (error) {
          setDbError(error);
        } else {
          setMaintenanceMode(data?.maintenance_mode ?? false);
        }
      } catch (err) {
        if (active) setDbError(err);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchMaintenanceStatus();
    
    return () => {
      active = false;
    };
  }, [location.pathname]);

  const isAdmin = user?.email === 'legacylifebuilder.konik@email.com';
  const isAdminPath = location.pathname.startsWith('/admin') || location.pathname.startsWith('/login');

  if (isLoading || authLoading) {
    return <PageLoader />;
  }

  if (dbError) {
    const errorMsg = dbError.message || String(dbError);
    const isConnectionError = 
      errorMsg.includes('504') || 
      errorMsg.includes('521') || 
      errorMsg.includes('522') || 
      errorMsg.includes('525') || 
      errorMsg.includes('Failed to fetch') ||
      errorMsg.includes('NetworkError') ||
      errorMsg.includes('upstream request timeout');

    if (isConnectionError) {
      return <MaintenancePage />;
    }
  }

  if (maintenanceMode && !isAdmin && !isAdminPath) {
    return <MaintenancePage />;
  }

  return <>{children}</>;
};

const RootLayout = () => {
  const { resolvedTheme } = useTheme();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ResponsiveToaster theme={(resolvedTheme as 'light' | 'dark') ?? 'dark'} />
        <MaintenanceGuard>
          <Outlet />
        </MaintenanceGuard>
      </AuthProvider>
    </QueryClientProvider>
  );
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<RootLayout />} errorElement={<ErrorPage />}>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/privacy" element={<SuspenseWrapper><PrivacyPage /></SuspenseWrapper>} />
      <Route path="/terms" element={<SuspenseWrapper><TermsPage /></SuspenseWrapper>} />
      <Route path="/refund" element={<SuspenseWrapper><RefundPage /></SuspenseWrapper>} />



      <Route path="/login" element={<AuthRoute><SuspenseWrapper><LoginPage /></SuspenseWrapper></AuthRoute>} />
      <Route path="/signup" element={<AuthRoute><SuspenseWrapper><SignupPage /></SuspenseWrapper></AuthRoute>} />
      <Route path="/forgot-password" element={<AuthRoute><SuspenseWrapper><ForgotPasswordPage /></SuspenseWrapper></AuthRoute>} />
      <Route path="/reset-password" element={<SuspenseWrapper><ResetPasswordPage /></SuspenseWrapper>} />
      <Route path="/personalize" element={<Navigate to="/today" replace />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/today" element={<SuspenseWrapper><TodayPage /></SuspenseWrapper>} />
          <Route path="/habits" element={<SuspenseWrapper><HabitsPage /></SuspenseWrapper>} />
          <Route path="/goals" element={<SuspenseWrapper><GoalsPage /></SuspenseWrapper>} />
          <Route path="/planner" element={<SuspenseWrapper><PlannerPage /></SuspenseWrapper>} />
          <Route path="/profile" element={<SuspenseWrapper><ProfilePage /></SuspenseWrapper>} />
          <Route path="/statistics" element={<SuspenseWrapper><StatisticsPage /></SuspenseWrapper>} />
          <Route path="/statistics/calculations" element={<SuspenseWrapper><StatsCalculationsPage /></SuspenseWrapper>} />
          <Route path="/vault" element={<SuspenseWrapper><VaultPage /></SuspenseWrapper>} />
          <Route path="/simulator" element={<SuspenseWrapper><SimulatorPage /></SuspenseWrapper>} />
        </Route>
        <Route path="/admin" element={<SuspenseWrapper><AdminPage /></SuspenseWrapper>} />
      </Route>
    </Route>
  )
);

function App() {
  React.useEffect(() => {
    // Clear the error reload flag if the application loads successfully
    window.sessionStorage.removeItem('page-reloaded-on-error');
  }, []);

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}

export default App;
