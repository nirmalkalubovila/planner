import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';

export default function AuthLayout() {
  const { user, isLoading } = useAuth();

  // Already signed in — don't show the login screen (mirrors apps/web's
  // AuthRoute guard in App.tsx).
  if (!isLoading && user) {
    return <Redirect href="/today" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
