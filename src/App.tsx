import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/auth-context';
import { ProtectedRoute } from './components/protected-route';
import { DashboardLayout } from './layout/dashboard-layout';
import { HabitsPage } from './pages/habits-page';
import { GoalsPage } from './pages/goals-page';
import { PlannerPage } from './pages/planner-page';
import { TodayPage } from './pages/today-page';
import { LoginPage } from './pages/login-page';
import { SignupPage } from './pages/signup-page';
import { ProfilePage } from './pages/profile-page';
import { PersonalizePage } from './pages/personalize-page';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// A small component to redirect logged-in users away from auth pages
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" theme="dark" richColors />
          <Routes>
            <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
            <Route path="/signup" element={<AuthRoute><SignupPage /></AuthRoute>} />

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
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
