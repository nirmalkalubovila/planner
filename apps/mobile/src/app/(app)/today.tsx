import React from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetCompletedTasks } from '@llb/api';
import { WeekUtils } from '@llb/core';
import { useAuth } from '@/contexts/auth-context';

/**
 * The Phase 5 vertical slice's actual deliverable: proof that auth,
 * session persistence (encrypted MMKV), @llb/api's React Query services,
 * and NativeWind styling all work together end to end on a real device.
 * Deliberately read-only and minimal — the real Today screen (deriving a
 * task list from goals/habits/the week plan, per
 * apps/web/src/features/today/hooks/use-today-tasks.ts) is Phase 6 work.
 */
export default function TodayScreen() {
  const { user, signOut } = useAuth();
  const dayStr = WeekUtils.getCurrentDay();
  const { data: taskIds, isLoading, isError, error } = useGetCompletedTasks(dayStr);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <View>
          <Text className="text-lg font-bold text-foreground">Today</Text>
          <Text className="text-xs text-muted-foreground">{user?.email}</Text>
        </View>
        <Pressable onPress={signOut} className="px-3 py-1.5 rounded-lg bg-muted">
          <Text className="text-muted-foreground text-sm">Sign out</Text>
        </Pressable>
      </View>

      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      )}

      {isError && (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-destructive text-center">{(error as Error)?.message}</Text>
        </View>
      )}

      {!isLoading && !isError && (
        <FlatList
          data={taskIds ?? []}
          keyExtractor={(id) => id}
          contentContainerClassName="p-4 gap-2"
          ListEmptyComponent={
            <Text className="text-muted-foreground text-center mt-8">
              No completed tasks for today yet.
            </Text>
          }
          renderItem={({ item }) => (
            <View className="rounded-lg border border-border bg-card px-4 py-3">
              <Text className="text-foreground">{item}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
