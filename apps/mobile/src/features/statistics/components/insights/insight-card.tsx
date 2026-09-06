import React from 'react';
import { Image, View } from 'react-native';
import { LinearGradient } from '@/components/ui/linear-gradient';
import { Text } from '@/components/ui/typography';
import type { InsightCardData } from '@llb/core';
import type { InsightTheme } from './insight-themes';

const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function SectionLabel({ children, color }: { children: string; color: string }) {
  return (
    <Text style={{ color, fontSize: 9, fontWeight: '900', letterSpacing: 2 }} className="uppercase">
      {children}
    </Text>
  );
}

/** One full-bleed story card. Web renders these in insight-card.tsx with a
 * branch per InsightCardData['type']; this covers the same union with RN
 * primitives — the shared shapes (metrics / listItems / radarData / quote /
 * grade / summaryData / milestoneData) drive which block renders, so a card
 * type the engine emits always has something to show even where the mobile
 * treatment is simpler than web's (radar renders as ranked bars rather than
 * a polygon, since a radar plot is unreadable at phone width). */
export function InsightCard({ card, theme }: { card: InsightCardData; theme: InsightTheme }) {
  return (
    <LinearGradient
      colors={theme.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, borderRadius: 28, overflow: 'hidden' }}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(6,8,14,0.55)', padding: 24 }}>
        <View className="flex-row items-center justify-between">
          <SectionLabel color="rgba(255,255,255,0.5)">Insight</SectionLabel>
          <Image
            source={require('../../../../../assets/images/llb-logo-white.png')}
            style={{ width: 22, height: 22, opacity: 0.8 }}
            resizeMode="contain"
          />
        </View>

        <View style={{ flex: 1, justifyContent: 'center' }} className="gap-4">
          <View className="gap-1.5">
            <Text style={{ color: '#ffffff', fontSize: 26, fontWeight: '900', lineHeight: 30 }}>
              {card.title}
            </Text>
            {!!card.subtitle && (
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '600' }}>
                {card.subtitle}
              </Text>
            )}
          </View>

          {!!card.grade && (
            <View className="items-center py-2">
              <Text style={{ color: theme.accent, fontSize: 72, fontWeight: '900' }}>{card.grade}</Text>
              {card.progressValue !== undefined && (
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700' }}>
                  {card.progressValue}%
                </Text>
              )}
            </View>
          )}

          {!!card.milestoneData && (
            <View className="gap-2">
              <Text style={{ color: theme.accent, fontSize: 40, fontWeight: '900' }}>
                {card.milestoneData.streakDays}-Day Streak
              </Text>
              <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '800' }}>
                {card.milestoneData.stageTitle}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 18 }}>
                {card.milestoneData.stageDescription}
              </Text>
            </View>
          )}

          {!!card.metrics?.length && (
            <View className="flex-row flex-wrap gap-3">
              {card.metrics.map((m, i) => (
                <View
                  key={i}
                  style={{
                    minWidth: '44%',
                    flexGrow: 1,
                    backgroundColor: 'rgba(255,255,255,0.07)',
                    borderColor: 'rgba(255,255,255,0.12)',
                    borderWidth: 1,
                    borderRadius: 18,
                    padding: 14,
                  }}
                >
                  <Text style={{ color: theme.accent, fontSize: 24, fontWeight: '900' }}>{m.value}</Text>
                  <Text
                    style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700' }}
                    className="uppercase tracking-wider mt-0.5"
                  >
                    {m.label}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {!!card.listItems?.length && (
            <View className="gap-2">
              {card.listItems.slice(0, 5).map((item, i) => (
                <View
                  key={i}
                  className="flex-row items-center justify-between"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    borderRadius: 14,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                  }}
                >
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
                      {item.label}
                    </Text>
                    {!!item.sublabel && (
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }} numberOfLines={1}>
                        {item.sublabel}
                      </Text>
                    )}
                  </View>
                  <Text style={{ color: theme.accent, fontSize: 14, fontWeight: '900' }}>{item.value}</Text>
                </View>
              ))}
            </View>
          )}

          {!!card.radarData?.length && (
            <View className="gap-2.5">
              {card.radarData.map((d, i) => (
                <View key={i} className="gap-1">
                  <View className="flex-row items-center justify-between">
                    <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700' }}>
                      {d.label}
                    </Text>
                    <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '900' }}>{d.value}%</Text>
                  </View>
                  <View
                    style={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'rgba(255,255,255,0.12)',
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        height: '100%',
                        width: `${Math.min(100, Math.max(0, d.value))}%`,
                        borderRadius: 3,
                        backgroundColor: theme.accent,
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {!!card.summaryData && (
            <View className="gap-3">
              <View className="flex-row justify-between">
                {card.summaryData.dailyActive.map((active, i) => (
                  <View key={i} className="items-center gap-1.5">
                    <View
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: active ? theme.accent : 'rgba(255,255,255,0.12)',
                      }}
                    />
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9 }}>
                      {DAY_INITIALS[i]}
                    </Text>
                  </View>
                ))}
              </View>
              <View className="flex-row flex-wrap gap-3">
                {[
                  { label: 'Tasks', value: card.summaryData.completedTasks },
                  { label: 'Hours', value: card.summaryData.hoursFocused },
                  { label: 'Habits', value: card.summaryData.habitsDone },
                  { label: 'Score', value: `${card.summaryData.legacyScore}%` },
                ].map((m) => (
                  <View key={m.label} style={{ minWidth: '44%', flexGrow: 1 }}>
                    <Text style={{ color: theme.accent, fontSize: 22, fontWeight: '900' }}>{m.value}</Text>
                    <Text
                      style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '700' }}
                      className="uppercase tracking-wider"
                    >
                      {m.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {!!card.quote && (
            <View className="gap-2">
              <Text style={{ color: '#ffffff', fontSize: 18, fontStyle: 'italic', lineHeight: 26 }}>
                &quot;{card.quote.text}&quot;
              </Text>
              {!!card.quote.author && (
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '700' }}>
                  — {card.quote.author}
                </Text>
              )}
            </View>
          )}

          {!!card.highlightText && !card.quote && (
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 21, fontWeight: '600' }}>
              {card.highlightText}
            </Text>
          )}
        </View>

        <SectionLabel color="rgba(255,255,255,0.4)">Legacy Life Builder</SectionLabel>
      </View>
    </LinearGradient>
  );
}
