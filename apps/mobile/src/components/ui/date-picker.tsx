import * as React from 'react';
import { Pressable, View } from 'react-native';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react-native';
import { StandardDialog } from '@/components/common/standard-dialog';
import { Calendar } from './calendar';
import { Text } from './typography';
import { cn } from '@/lib/cn';

interface CustomDatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selected,
  onChange,
  placeholderText = 'Pick a date',
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="w-full flex-row items-center justify-between h-9 px-3 rounded-lg border border-border bg-muted"
      >
        <Text className={cn('text-sm', !selected && 'text-muted-foreground')} numberOfLines={1}>
          {selected ? format(selected, 'PPP') : placeholderText}
        </Text>
        <CalendarIcon size={16} color="#e4e4e7" />
      </Pressable>

      <StandardDialog isOpen={open} onClose={() => setOpen(false)} title="Select date" hideClose={false}>
        <View className="items-center">
          <Calendar
            selected={selected || undefined}
            onSelect={(date) => {
              onChange(date || null);
              setOpen(false);
            }}
          />
        </View>
      </StandardDialog>
    </>
  );
};
