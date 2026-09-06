import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/typography';
import { PerformanceDashboard } from '@/features/statistics/components/performance-dashboard';

export default function StatisticsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={[]}>
      <ScrollView contentContainerClassName="p-4 gap-5">
        <View className="pb-4 border-b border-border">
          <Text variant="tiny" className="uppercase tracking-[0.3em] font-bold">
            Performance
          </Text>
          <View className="flex-row items-center gap-2 mt-2">
            <View className="h-1 w-12 bg-primary/40 rounded-full" />
            <Text variant="tiny" className="font-black uppercase">
              Statistics
            </Text>
          </View>
        </View>

        <PerformanceDashboard />
      </ScrollView>
    </SafeAreaView>
  );
}
