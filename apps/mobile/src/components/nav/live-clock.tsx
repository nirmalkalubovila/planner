import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { format } from 'date-fns';
import { Text } from '@/components/ui/typography';

/** The header clock from apps/web/src/layout/header.tsx (its middle
 * column): a small date line above a ticking monospace HH:mm:ss. Same
 * one-second setInterval as web's use-time-lived hook; the age-counter half
 * of that hook stays web-only for now, since it needs the profile's DOB and
 * there's no room for it at phone width. */
export function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View className="items-center">
      <Text
        variant="tiny"
        className="uppercase tracking-[0.15em] text-muted-foreground font-semibold"
      >
        {format(now, 'yyyy, MMM dd')}
      </Text>
      <Text className="text-base font-bold text-foreground tabular-nums tracking-wider">
        {format(now, 'HH:mm:ss')}
      </Text>
    </View>
  );
}
