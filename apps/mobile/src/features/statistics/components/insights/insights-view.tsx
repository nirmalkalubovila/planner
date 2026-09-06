import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { LinearGradient } from '@/components/ui/linear-gradient';
import { Brain, Calendar, Flame, Play, Sparkles, Trophy, Zap } from 'lucide-react-native';
import type { SystemWin } from '@llb/core';
import { PageLoader } from '@/components/common/page-loader';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';
import { useInsights } from '../../hooks/use-insights';
import { getInsightTheme } from './insight-themes';
import { StoryViewer } from './story-viewer';

const WIN_STYLES: Record<
  SystemWin['type'],
  { color: string; Icon: React.ComponentType<{ size?: number; color?: string }> }
> = {
  goal: { color: '#34d399', Icon: Trophy },
  habit: { color: '#3b82f6', Icon: Flame },
  execution: { color: '#f59e0b', Icon: Zap },
  vault: { color: '#818cf8', Icon: Brain },
};

/** Port of apps/web/.../insights/insights-view.tsx: weekly/monthly toggle,
 * a stacked deck preview that opens the story viewer, and the system-wins
 * list below it. */
export const InsightsView: React.FC = () => {
  const { data, isLoading } = useInsights();
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly');
  const [viewerOpen, setViewerOpen] = useState(false);

  if (isLoading || !data) {
    return <PageLoader />;
  }

  const currentCards = activeTab === 'weekly' ? data.weekly || [] : data.monthly || [];
  const wins = activeTab === 'weekly' ? data.weeklyWins || [] : data.monthlyWins || [];

  const now = new Date();
  const hashSeed =
    activeTab === 'weekly'
      ? now.toISOString().split('T')[0]
      : `${now.getFullYear()}-${now.getMonth() + 1}`;

  return (
    <View className="gap-6">
      <View className="border-b border-border pb-4">
        <View className="flex-row items-center gap-1 p-1 rounded-full bg-muted border border-border self-start">
          {(
            [
              { id: 'weekly' as const, label: 'Weekly', Icon: Sparkles },
              { id: 'monthly' as const, label: 'Monthly', Icon: Calendar },
            ]
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-row items-center gap-1.5 px-4 py-2 rounded-full',
                  isActive && 'bg-accent border border-border'
                )}
              >
                <tab.Icon size={12} color={isActive ? '#e4e4e7' : '#71717a'} />
                <Text
                  className={cn(
                    'text-xs font-black uppercase tracking-wider',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {currentCards.length > 0 ? (
        <View className="items-center gap-5 py-2">
          <Text variant="tiny" className="uppercase tracking-widest font-black">
            Card Deck Preview
          </Text>

          <View style={{ height: 260, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
            {currentCards
              .slice(0, 3)
              .map((card, idx) => {
                const theme = getInsightTheme(idx, hashSeed);
                const rotations = [4, -4, 2];
                return (
                  <LinearGradient
                    key={idx}
                    colors={theme.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      position: 'absolute',
                      width: 210,
                      height: 250,
                      borderRadius: 24,
                      padding: 16,
                      justifyContent: 'space-between',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.12)',
                      transform: [{ rotate: `${rotations[idx]}deg` }, { translateY: idx * 8 }],
                      zIndex: 3 - idx,
                      elevation: 3 - idx,
                    }}
                  >
                    <Text
                      style={{ color: 'rgba(255,255,255,0.5)', fontSize: 8, fontWeight: '900', letterSpacing: 2 }}
                      className="uppercase"
                    >
                      Insight
                    </Text>
                    <View className="gap-1">
                      <Text
                        style={{ color: '#ffffff', fontSize: 13, fontWeight: '900' }}
                        className="uppercase"
                        numberOfLines={2}
                      >
                        {card.title}
                      </Text>
                      {!!card.highlightText && (
                        <Text
                          style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600' }}
                          numberOfLines={4}
                        >
                          {card.highlightText}
                        </Text>
                      )}
                    </View>
                    <View />
                  </LinearGradient>
                );
              })
              // Painted back-to-front so the first card ends up on top.
              .reverse()}
          </View>

          <Pressable
            onPress={() => setViewerOpen(true)}
            className="flex-row items-center gap-2 px-6 py-3.5 rounded-2xl bg-primary active:opacity-90"
          >
            <Play size={13} color="#000000" fill="#000000" />
            <Text className="text-xs font-black uppercase tracking-widest text-primary-foreground">
              {activeTab === 'weekly' ? 'Play Reflections Story' : 'Play Monthly Story'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="rounded-3xl border border-dashed border-border bg-card/20 p-10 items-center gap-4">
          <View className="w-16 h-16 rounded-2xl bg-muted border border-border items-center justify-center">
            <Sparkles size={32} color="#3f3f46" />
          </View>
          <View className="gap-1">
            <Text className="text-sm font-black text-foreground uppercase tracking-widest text-center">
              No Insights Generated Yet
            </Text>
            <Text variant="tiny" className="text-center leading-relaxed">
              Keep planning your planner grid, completing tasks on the Today view, and creating vault
              entries. Your wrapped report will populate soon!
            </Text>
          </View>
        </View>
      )}

      <View className="gap-4">
        <View className="flex-row items-center gap-2">
          <Sparkles size={16} color="#e4e4e7" />
          <Text className="text-xs font-black uppercase tracking-widest text-foreground">
            {activeTab === 'weekly' ? 'Weekly System Breakthroughs' : 'Monthly System Breakthroughs'}
          </Text>
        </View>

        {wins.length > 0 ? (
          <View className="gap-3">
            {wins.map((win) => {
              const style = WIN_STYLES[win.type];
              return (
                <View
                  key={win.id}
                  className="rounded-2xl border border-border bg-card/60 p-4 flex-row gap-3 items-start overflow-hidden"
                >
                  <View
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 14,
                      bottom: 14,
                      width: 4,
                      borderTopRightRadius: 4,
                      borderBottomRightRadius: 4,
                      backgroundColor: style.color,
                    }}
                  />
                  <View className="p-2 rounded-xl bg-muted ml-2">
                    <style.Icon size={16} color={style.color} />
                  </View>
                  <View className="flex-1 gap-1">
                    <Text variant="tiny" className="font-black uppercase tracking-wider" numberOfLines={1}>
                      {win.title}
                    </Text>
                    <Text variant="small" className="text-foreground font-medium leading-normal">
                      {win.description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View className="p-6 rounded-2xl bg-muted/20 border border-border">
            <Text variant="tiny" className="text-center">
              Complete tasks, build habit streaks, and achieve goals to generate breakthrough wins!
            </Text>
          </View>
        )}
      </View>

      <StoryViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        cards={currentCards}
        hashSeed={hashSeed}
      />
    </View>
  );
};
