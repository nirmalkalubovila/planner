import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/auth-context';
import { ProtectedRoute } from './components/protected-route';
import { DashboardLayout } from './layout/dashboard-layout';
import { HabitsPage } from './pages/habits/habits-page';
import { GoalsPage } from './pages/goals/goals-page';
import { PlannerPage } from './pages/planner/planner-page';
import { TodayPage } from './pages/today/today-page';
import { LoginPage } from './pages/auth/login-page';
import { SignupPage } from './pages/auth/signup-page';
import { ProfilePage } from './pages/profile/profile-page';
import { PersonalizePage } from './pages/auth/personalize-page';
import { ForgotPasswordPage } from './pages/auth/forgot-password-page';
import { ResetPasswordPage } from './pages/auth/reset-password-page';
import { Toaster } from 'sonner';

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
      <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
      <Route path="/signup" element={<AuthRoute><SignupPage /></AuthRoute>} />
      <Route path="/forgot-password" element={<AuthRoute><ForgotPasswordPage /></AuthRoute>} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<TodayPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="/personalize" element={<PersonalizePage />} />
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
