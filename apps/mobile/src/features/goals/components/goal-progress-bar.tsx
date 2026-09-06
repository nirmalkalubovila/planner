import React, { useState } from 'react';
import { ScrollView, View, type LayoutChangeEvent } from 'react-native';
import { format, parseISO } from 'date-fns';
import { Check, Play, Target } from 'lucide-react-native';
import type { Milestone } from '@llb/core';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';

interface GoalProgressBarProps {
  milestones: Milestone[];
  progressPercentage: number;
  startDate?: string;
}

const NODE_WIDTH = 44; // w-11
const MIN_CONNECTOR_WIDTH = 14;

function formatShort(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MM/dd');
  } catch {
    return dateStr;
  }
}

/** The node/connector row mirrors web's `flex-1` connectors inside an
 * `overflow-x-auto` container: when everything fits, connectors stretch to
 * fill the full card width (evenly spaced, matching web); when it doesn't,
 * it falls back to natural spacing inside a horizontal scroll. RN has no
 * built-in "grow to fill, else scroll" — a plain View with flex-1 children
 * only distributes space it actually has, and a ScrollView's content
 * container has no bound to grow against at all (which is why an earlier
 * version rendered every connector collapsed to its min-width, bunched
 * left) — so this measures the container and picks one of the two modes. */
export const GoalProgressBar: React.FC<GoalProgressBarProps> = ({ milestones, progressPercentage, startDate }) => {
  const [containerWidth, setContainerWidth] = useState(0);

  if (!milestones || milestones.length === 0) return null;
  const total = milestones.length;
  const completedCount = milestones.filter(
    (m, idx) => m.completed || progressPercentage >= ((idx + 1) / total) * 100
  ).length;
  const startLabel = startDate ? formatShort(startDate) : 'Start';

  const nodeCount = total + 1;
  const naturalContentWidth = nodeCount * NODE_WIDTH + total * MIN_CONNECTOR_WIDTH;
  const fitsWithoutScroll = containerWidth > 0 && naturalContentWidth <= containerWidth;
  const connectorWidth = fitsWithoutScroll
    ? Math.max(MIN_CONNECTOR_WIDTH, (containerWidth - nodeCount * NODE_WIDTH) / total)
    : MIN_CONNECTOR_WIDTH;

  const handleLayout = (e: LayoutChangeEvent) => setContainerWidth(e.nativeEvent.layout.width);

  const nodes = (
    <>
      <View className="items-center gap-1" style={{ width: NODE_WIDTH }}>
        <View className="w-6 h-6 rounded-full border border-emerald-500 bg-emerald-500/10 items-center justify-center">
          <Play size={9} color="#34d399" />
        </View>
        <Text variant="tiny" className="text-emerald-400 font-bold">
          Start
        </Text>
        <Text variant="tiny">{startLabel}</Text>
      </View>

      {milestones.map((m, idx) => {
        const milestonePos = ((idx + 1) / total) * 100;
        const isCompleted = m.completed || progressPercentage >= milestonePos;
        return (
          <React.Fragment key={m.id}>
            <View className={cn('h-[2px]', isCompleted ? 'bg-emerald-500/60' : 'bg-muted')} style={{ width: connectorWidth }} />
            <View className="items-center gap-1" style={{ width: NODE_WIDTH }}>
              <View
                className={cn(
                  'w-6 h-6 rounded-full border items-center justify-center',
                  isCompleted ? 'bg-emerald-500/10 border-emerald-500' : 'bg-muted border-border'
                )}
              >
                {isCompleted ? (
                  <Check size={10} color="#34d399" />
                ) : (
                  <Text variant="tiny" className="font-black">
                    P{idx + 1}
                  </Text>
                )}
              </View>
              <Text
                variant="tiny"
                className={cn('font-bold text-center', isCompleted ? 'text-emerald-400' : undefined)}
                numberOfLines={1}
              >
                {m.title}
              </Text>
              <Text variant="tiny">{formatShort(m.targetDate)}</Text>
            </View>
          </React.Fragment>
        );
      })}
    </>
  );

  return (
    <View className="mt-1 gap-2">
      <View className="flex-row items-center gap-3">
        <View className="flex-row items-center gap-1.5">
          <Target size={12} color="#a1a1aa" />
          <Text className="text-xs font-bold text-foreground font-mono">{Math.round(progressPercentage)}%</Text>
        </View>
        <View className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <View className="h-full bg-primary/70 rounded-full" style={{ width: `${Math.min(progressPercentage, 100)}%` }} />
        </View>
        <Text variant="tiny" className="font-black uppercase">
          {completedCount}/{total}
        </Text>
      </View>

      <View onLayout={handleLayout}>
        {fitsWithoutScroll ? (
          <View className="flex-row items-center">{nodes}</View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="flex-row items-center">
            {nodes}
          </ScrollView>
        )}
      </View>
    </View>
  );
};
