import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { PageLoader } from '@/components/common/page-loader';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';
import { useDetailedAnalytics } from '../hooks/use-detailed-stats';
import { useUserStats } from '../hooks/use-user-stats';
import { SummaryView } from './summary-view';
import { DetailedView } from './detailed-view';
import { InsightsView } from './insights/insights-view';

type Tab = 'summary' | 'detailed' | 'insights';

const TABS: { id: Tab; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'detailed', label: 'Detailed' },
  { id: 'insights', label: 'Insights' },
];

/** Port of apps/web/.../performance-dashboard.tsx — all three tabs now
 * wired: Summary, Detailed (panels of goals/habits/weeks/buckets), and
 * Insights (deck preview + story viewer). */
export const PerformanceDashboard: React.FC = () => {
  const { data: cache, isLoading: cacheLoading } = useUserStats();
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const { data: detailed } = useDetailedAnalytics(true);

  if (cacheLoading || !cache) {
    return <PageLoader />;
  }

  return (
    <View className="gap-5">
      <View className="flex-row items-center gap-1 p-1 rounded-full bg-muted border border-border self-start">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className={cn('px-4 py-2 rounded-full', isActive && 'bg-accent border border-border')}
            >
              <Text className={cn('text-xs font-bold uppercase tracking-widest', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activeTab === 'summary' && (
        <SummaryView cache={cache} detailed={detailed} onSwitchToInsights={() => setActiveTab('insights')} />
      )}
      {activeTab === 'detailed' &&
        (detailed ? (
          <DetailedView data={detailed} />
        ) : (
          // useDetailedAnalytics pulls six tables and aggregates them on the
          // JS thread, so it can still be in flight after the summary cache
          // has landed and rendered the tab strip.
          <PageLoader />
        ))}
      {activeTab === 'insights' && <InsightsView />}
    </View>
  );
};
