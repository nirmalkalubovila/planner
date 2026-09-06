import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Clock } from 'lucide-react-native';
import { StandardDialog } from '@/components/common/standard-dialog';
import { Text } from './typography';
import { cn } from '@/lib/cn';

interface SimpleTimePickerProps {
  value: string; // "HH:mm"
  onChange: (value: string) => void;
  allowAllMinutes?: boolean;
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/** RN twin of apps/web/src/components/ui/simple-time-picker.tsx — same
 * three-column Hour/Minute/AM-PM picker, opened in a StandardDialog instead
 * of a Radix Popover (no anchored-popover primitive on RN). */
export const SimpleTimePicker: React.FC<SimpleTimePickerProps> = ({ value, onChange, allowAllMinutes }) => {
  const safeValue = value || '09:00';
  const [h24Str, mStr] = safeValue.split(':');
  const h24 = parseInt(h24Str, 10);
  const isPm = h24 >= 12;
  const h12 = h24 % 12 || 12;
  const displayMinute = mStr || '00';

  const [open, setOpen] = React.useState(false);
  const minutes = allowAllMinutes
    ? Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))
    : ['00', '30'];

  const updateTime = (newH12: number, newM: string, newIsPm: boolean) => {
    let finalH24 = newH12;
    if (newIsPm && newH12 < 12) finalH24 += 12;
    if (!newIsPm && newH12 === 12) finalH24 = 0;
    onChange(`${finalH24.toString().padStart(2, '0')}:${newM}`);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="w-full flex-row items-center justify-between h-11 px-3.5 rounded-xl border border-border bg-muted"
      >
        <Text className="text-sm font-semibold text-foreground">
          {`${h12.toString().padStart(2, '0')}:${displayMinute} ${isPm ? 'PM' : 'AM'}`}
        </Text>
        <Clock size={16} color="#a1a1aa" />
      </Pressable>

      <StandardDialog isOpen={open} onClose={() => setOpen(false)} title="Select time">
        <View className="flex-row justify-center p-2">
          <TimeColumn label="Hr">
            {HOURS.map((h) => (
              <TimeCell key={h} selected={h12 === h} onPress={() => updateTime(h, displayMinute, isPm)}>
                {h.toString().padStart(2, '0')}
              </TimeCell>
            ))}
          </TimeColumn>
          <TimeColumn label="Min">
            {minutes.map((m) => (
              <TimeCell key={m} selected={displayMinute === m} onPress={() => updateTime(h12, m, isPm)}>
                {m}
              </TimeCell>
            ))}
          </TimeColumn>
          <TimeColumn label="Set">
            {(['AM', 'PM'] as const).map((p) => (
              <TimeCell key={p} selected={(isPm ? 'PM' : 'AM') === p} onPress={() => updateTime(h12, displayMinute, p === 'PM')}>
                {p}
              </TimeCell>
            ))}
          </TimeColumn>
        </View>
      </StandardDialog>
    </>
  );
};

function TimeColumn({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="w-[70px] border-l border-border first:border-l-0">
      <View className="py-2 border-b border-border">
        <Text variant="tiny" className="text-center uppercase font-bold">
          {label}
        </Text>
      </View>
      <ScrollView className="h-[190px]" contentContainerClassName="p-1 gap-0.5">
        {children}
      </ScrollView>
    </View>
  );
}

function TimeCell({
  selected,
  onPress,
  children,
}: {
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'h-9 items-center justify-center rounded-lg border border-transparent',
        selected && 'bg-primary/10 border-primary/20'
      )}
    >
      <Text className={cn('text-xs font-semibold', selected ? 'text-primary' : 'text-muted-foreground')}>
        {children}
      </Text>
    </Pressable>
  );
}
