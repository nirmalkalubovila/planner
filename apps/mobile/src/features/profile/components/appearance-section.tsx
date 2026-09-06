import React from 'react';
import { Switch, View } from 'react-native';
import { Moon } from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { resolveThemeColor } from '@/lib/theme-palette';
import { Text } from '@/components/ui/typography';

/** System preferences: theme now lives here rather than the top nav bar. */
export function AppearanceSection() {
  const { colorScheme, setPreference } = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className="bg-card border border-border rounded-2xl p-5 gap-3">
      <Text className="text-base font-bold text-foreground">Appearance</Text>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2.5 flex-1">
          <Moon size={14} color="#a1a1aa" />
          <View className="flex-1">
            <Text variant="small" className="font-semibold">
              Dark Mode
            </Text>
            <Text variant="tiny">{isDark ? 'On' : 'Off — using light theme'}</Text>
          </View>
        </View>
        <Switch
          value={isDark}
          onValueChange={(value) => setPreference(value ? 'dark' : 'light')}
          trackColor={{ false: '#3f3f46', true: resolveThemeColor('primary', 'dark') }}
        />
      </View>
    </View>
  );
}
