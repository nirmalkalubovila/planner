import { Redirect, Tabs } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { BarChart2, CalendarCheck, CalendarRange, CircleUser, Repeat, Target, Vault } from 'lucide-react-native';
import { useAuth } from '@/contexts/auth-context';
import { NotificationBootstrap } from '@/features/notifications/notification-bootstrap';
import { TopNavBar } from '@/components/nav/top-nav-bar';
import { CustomTabBar } from '@/components/nav/custom-tab-bar';
import { useWidgetSync } from '@/features/widgets/hooks/use-widget-sync';

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

  return <AuthenticatedAppLayout />;
}

function AuthenticatedAppLayout() {
  // Only mounts once `user` is confirmed above, so its data hooks (inside
  // useWidgetSync) never fire during the loading/unauthenticated window.
  useWidgetSync();

  // 7 core-app tabs, "today" centered (position 4 of 7) and rendered as a
  // raised floating button by CustomTabBar — see its FLOATING_ROUTE_NAME.
  return (
    <View className="flex-1 bg-background">
      <NotificationBootstrap />
      <TopNavBar />
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tabs.Screen
          name="habits"
          options={{
            title: 'Habits',
            tabBarIcon: ({ color, size }) => <Repeat size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="goals"
          options={{
            title: 'Goals',
            tabBarIcon: ({ color, size }) => <Target size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="planner"
          options={{
            title: 'Planner',
            tabBarIcon: ({ color, size }) => <CalendarRange size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="today"
          options={{
            title: 'Today',
            tabBarIcon: ({ color, size }) => <CalendarCheck size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="vault"
          options={{
            title: 'Vault',
            tabBarIcon: ({ color, size }) => <Vault size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="statistics"
          options={{
            title: 'Stats',
            tabBarIcon: ({ color, size }) => <BarChart2 size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <CircleUser size={size} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
