import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/auth-context';
import { ProtectedRoute } from './components/protected-route';
import { DashboardLayout } from './layout/dashboard-layout';
import { Toaster } from 'sonner';

import { PageLoader } from './components/common/page-loader';

const HabitsPage = React.lazy(() => import('./features/habits/habits-page').then(m => ({ default: m.HabitsPage })));
const GoalsPage = React.lazy(() => import('./features/goals/goals-page').then(m => ({ default: m.GoalsPage })));
const PlannerPage = React.lazy(() => import('./features/planner/planner-page').then(m => ({ default: m.PlannerPage })));
const TodayPage = React.lazy(() => import('./features/today/today-page').then(m => ({ default: m.TodayPage })));
const LoginPage = React.lazy(() => import('./features/auth/login-page').then(m => ({ default: m.LoginPage })));
const SignupPage = React.lazy(() => import('./features/auth/signup-page').then(m => ({ default: m.SignupPage })));
const ProfilePage = React.lazy(() => import('./features/profile/profile-page').then(m => ({ default: m.ProfilePage })));
const StatisticsPage = React.lazy(() => import('./features/statistics/statistics-page').then(m => ({ default: m.StatisticsPage })));
const PersonalizePage = React.lazy(() => import('./features/auth/personalize-page').then(m => ({ default: m.PersonalizePage })));
const ForgotPasswordPage = React.lazy(() => import('./features/auth/forgot-password-page').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = React.lazy(() => import('./features/auth/reset-password-page').then(m => ({ default: m.ResetPasswordPage })));

const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

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

const RootLayout = () => {
  return (
    <>
      <Toaster position="bottom-right" theme="dark" richColors />
      <Outlet />
    </>
  );
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<RootLayout />}>
      <Route path="/login" element={<AuthRoute><SuspenseWrapper><LoginPage /></SuspenseWrapper></AuthRoute>} />
      <Route path="/signup" element={<AuthRoute><SuspenseWrapper><SignupPage /></SuspenseWrapper></AuthRoute>} />
      <Route path="/forgot-password" element={<AuthRoute><SuspenseWrapper><ForgotPasswordPage /></SuspenseWrapper></AuthRoute>} />
      <Route path="/reset-password" element={<SuspenseWrapper><ResetPasswordPage /></SuspenseWrapper>} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<SuspenseWrapper><TodayPage /></SuspenseWrapper>} />
          <Route path="/habits" element={<SuspenseWrapper><HabitsPage /></SuspenseWrapper>} />
          <Route path="/goals" element={<SuspenseWrapper><GoalsPage /></SuspenseWrapper>} />
          <Route path="/planner" element={<SuspenseWrapper><PlannerPage /></SuspenseWrapper>} />
          <Route path="/profile" element={<SuspenseWrapper><ProfilePage /></SuspenseWrapper>} />
          <Route path="/statistics" element={<SuspenseWrapper><StatisticsPage /></SuspenseWrapper>} />
        </Route>
        <Route path="/personalize" element={<SuspenseWrapper><PersonalizePage /></SuspenseWrapper>} />
      </Route>
    </Route>
  )
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
