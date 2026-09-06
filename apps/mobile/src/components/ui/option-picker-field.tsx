import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { StandardDialog } from '@/components/common/standard-dialog';
import { Text } from './typography';
import { cn } from '@/lib/cn';

export interface PickerOption {
  value: string;
  label: string;
  group?: string;
}

interface OptionPickerFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  options: PickerOption[];
  placeholder?: string;
  emptyOptionLabel?: string;
  title?: string;
}

/** Like `SelectField`, but for id/label pairs (SelectField only takes
 * `string[]` where the value IS the label — not enough for "select a goal
 * to link", where the value is an id). Optionally groups options under a
 * header (mirrors web's Radix `<optgroup>` in sunday-focus-dialog). */
export const OptionPickerField: React.FC<OptionPickerFieldProps> = ({
  value,
  onValueChange,
  options,
  placeholder = 'Select...',
  emptyOptionLabel,
  title = 'Select an option',
}) => {
  const [open, setOpen] = React.useState(false);
  const selected = options.find(o => o.value === value);

  const groups = React.useMemo(() => {
    const map = new Map<string, PickerOption[]>();
    options.forEach(o => {
      const g = o.group || '';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(o);
    });
    return Array.from(map.entries());
  }, [options]);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="w-full flex-row items-center justify-between h-10 px-3.5 rounded-xl border border-border bg-muted"
      >
        <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
          {selected ? selected.label : (emptyOptionLabel || placeholder)}
        </Text>
        <ChevronDown size={16} color="#a1a1aa" />
      </Pressable>

      <StandardDialog isOpen={open} onClose={() => setOpen(false)} title={title}>
        <View className="p-2">
          {emptyOptionLabel && (
            <Pressable
              onPress={() => { onValueChange(''); setOpen(false); }}
              className={cn('flex-row items-center justify-between px-3.5 py-3 rounded-xl', !value && 'bg-accent')}
            >
              <Text className={cn('text-sm italic', !value ? 'text-primary font-semibold' : 'text-muted-foreground')}>
                {emptyOptionLabel}
              </Text>
              {!value && <Check size={16} color="#e4e4e7" />}
            </Pressable>
          )}
          {groups.map(([group, opts]) => (
            <View key={group || 'ungrouped'}>
              {!!group && (
                <Text variant="tiny" className="uppercase font-bold px-3.5 pt-3 pb-1">
                  {group}
                </Text>
              )}
              {opts.map(option => {
                const isSelected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => { onValueChange(option.value); setOpen(false); }}
                    className={cn('flex-row items-center justify-between px-3.5 py-3 rounded-xl', isSelected && 'bg-accent')}
                  >
                    <Text className={cn('text-sm flex-1', isSelected ? 'text-primary font-semibold' : 'text-foreground')} numberOfLines={1}>
                      {option.label}
                    </Text>
                    {isSelected && <Check size={16} color="#e4e4e7" />}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </StandardDialog>
    </>
  );
};
