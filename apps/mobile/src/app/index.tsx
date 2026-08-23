import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/auth-context';

export default function IndexGate() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  return <Redirect href={user ? '/today' : '/login'} />;
}
