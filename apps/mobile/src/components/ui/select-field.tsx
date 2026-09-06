import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { StandardDialog } from '@/components/common/standard-dialog';
import { Text } from './typography';
import { cn } from '@/lib/cn';

interface SelectFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  title?: string;
}

/** A StandardDialog-based single-choice picker — stands in for web's Radix
 * <Select>, which has no RN equivalent (no anchored-popover primitive). */
export const SelectField: React.FC<SelectFieldProps> = ({ value, onValueChange, options, title = 'Select an option' }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="w-full flex-row items-center justify-between h-10 px-3.5 rounded-xl border border-border bg-muted"
      >
        <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
          {value || 'Select...'}
        </Text>
        <ChevronDown size={16} color="#a1a1aa" />
      </Pressable>

      <StandardDialog isOpen={open} onClose={() => setOpen(false)} title={title}>
        <View className="p-2">
          {options.map((option) => {
            const isSelected = option === value;
            return (
              <Pressable
                key={option}
                onPress={() => {
                  onValueChange(option);
                  setOpen(false);
                }}
                className={cn('flex-row items-center justify-between px-3.5 py-3 rounded-xl', isSelected && 'bg-accent')}
              >
                <Text className={cn('text-sm', isSelected ? 'text-primary font-semibold' : 'text-foreground')}>
                  {option}
                </Text>
                {isSelected && <Check size={16} color="#e4e4e7" />}
              </Pressable>
            );
          })}
        </View>
      </StandardDialog>
    </>
  );
};
