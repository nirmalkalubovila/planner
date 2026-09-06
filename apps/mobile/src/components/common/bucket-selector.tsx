import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Briefcase, HeartPulse, Sparkles, Users } from 'lucide-react-native';
import { LIFE_BUCKETS, BUCKET_META, type LifeBucket } from '@llb/core';
import { BUCKET_TONE } from '@llb/tokens';
import { BUCKET_CLASSES } from '@/theme/bucket-classes';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';

interface BucketSelectorProps {
  value?: LifeBucket | null;
  onChange: (value: LifeBucket | null) => void;
}

const BUCKET_ICONS: Record<LifeBucket, React.ComponentType<{ size?: number; color?: string }>> = {
  income: Briefcase,
  asset: Sparkles,
  recovery: HeartPulse,
  relational: Users,
};

export const BucketSelector: React.FC<BucketSelectorProps> = ({ value, onChange }) => {
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-foreground">
          Life Bucket <Text variant="small">(Optional)</Text>
        </Text>
        {value && (
          <Pressable onPress={() => onChange(null)}>
            <Text variant="tiny" className="uppercase font-bold">
              Clear
            </Text>
          </Pressable>
        )}
      </View>

      <View className="flex-row flex-wrap gap-2">
        {LIFE_BUCKETS.map((bucketKey) => {
          const meta = BUCKET_META[bucketKey];
          const classes = BUCKET_CLASSES[bucketKey];
          const isSelected = value === bucketKey;
          const Icon = BUCKET_ICONS[bucketKey];
          return (
            <Pressable
              key={bucketKey}
              onPress={() => onChange(isSelected ? null : bucketKey)}
              className={cn(
                'flex-row items-start gap-2 p-2.5 rounded-xl border basis-[47%] grow',
                isSelected ? 'bg-accent border-foreground/30' : 'bg-card/60 border-border'
              )}
            >
              <View
                className={cn(
                  'p-1 rounded-lg border mt-0.5',
                  isSelected ? classes.badgeClass : 'bg-muted border-border'
                )}
              >
                <Icon size={14} color={isSelected ? BUCKET_TONE[bucketKey].hex : '#a1a1aa'} />
              </View>
              <View className="flex-1 min-w-0">
                <Text
                  className={cn('text-xs font-bold', isSelected ? classes.color : 'text-muted-foreground')}
                  numberOfLines={1}
                >
                  {meta.label}
                </Text>
                <Text variant="tiny" numberOfLines={1}>
                  {meta.description}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
