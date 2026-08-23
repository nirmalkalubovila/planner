import { Redirect, Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/auth-context';

export default function AppLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  // Mirrors apps/web's ProtectedRoute — no session, no access.
  if (!user) {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
