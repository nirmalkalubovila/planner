import * as React from 'react';
import { Pressable, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  getMonth,
  getYear,
  isSameDay,
  isSameMonth,
  setMonth,
  setYear,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { Text } from './typography';
import { cn } from '@/lib/cn';

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  defaultMonth?: Date;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** RN twin of apps/web/src/components/ui/calendar.tsx — same date-fns math,
 * div/button swapped for View/Pressable per the plan's note that this file
 * ports in an afternoon (do not adopt a calendar library). */
export function Calendar({ selected, onSelect, defaultMonth }: CalendarProps) {
  const [view, setView] = React.useState<'calendar' | 'months' | 'years'>('calendar');
  const [currentMonth, setCurrentMonth] = React.useState(defaultMonth || selected || new Date());
  const [yearRangeStart, setYearRangeStart] = React.useState(Math.floor(getYear(currentMonth) / 12) * 12);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const daysArr: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    daysArr.push(day);
    day = addDays(day, 1);
  }
  const weeks: Date[][] = [];
  for (let i = 0; i < daysArr.length; i += 7) {
    weeks.push(daysArr.slice(i, i + 7));
  }

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleMonthSelect = (m: number) => {
    setCurrentMonth(setMonth(currentMonth, m));
    setView('calendar');
  };
  const handleYearSelect = (y: number) => {
    setCurrentMonth(setYear(currentMonth, y));
    setView('months');
  };

  const isToday = (d: Date) => isSameDay(d, new Date());
  const isSelected = (d: Date) => (selected ? isSameDay(d, selected) : false);
  const isOutside = (d: Date) => !isSameMonth(d, currentMonth);

  const renderCalendar = () => (
    <>
      <View className="flex-row mb-1">
        {WEEKDAYS.map((wd) => (
          <View key={wd} className="h-9 w-9 items-center justify-center">
            <Text variant="small">{wd}</Text>
          </View>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} className="flex-row">
          {week.map((d, di) => {
            const outside = isOutside(d);
            return (
              <Pressable
                key={di}
                onPress={() => onSelect?.(d)}
                className={cn(
                  'h-9 w-9 items-center justify-center rounded-md',
                  isToday(d) && !isSelected(d) && 'bg-accent',
                  isSelected(d) && 'bg-primary'
                )}
              >
                <Text
                  className={cn(
                    'text-sm',
                    outside && 'text-muted-foreground opacity-40',
                    isSelected(d) && 'text-primary-foreground font-semibold'
                  )}
                >
                  {format(d, 'd')}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </>
  );

  const renderMonths = () => (
    <View className="flex-row flex-wrap gap-2 p-1">
      {Array.from({ length: 12 }, (_, i) => (
        <Pressable
          key={i}
          onPress={() => handleMonthSelect(i)}
          className={cn(
            'h-10 px-3 items-center justify-center rounded-md basis-[30%] grow',
            getMonth(currentMonth) === i ? 'bg-primary' : ''
          )}
        >
          <Text className={cn('text-xs font-semibold', getMonth(currentMonth) === i && 'text-primary-foreground')}>
            {format(new Date(2000, i, 1), 'MMM')}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const renderYears = () => {
    const years = Array.from({ length: 12 }, (_, i) => yearRangeStart + i);
    return (
      <View className="flex-row flex-wrap gap-2 p-1">
        {years.map((y) => (
          <Pressable
            key={y}
            onPress={() => handleYearSelect(y)}
            className={cn(
              'h-10 px-3 items-center justify-center rounded-md basis-[30%] grow',
              getYear(currentMonth) === y ? 'bg-primary' : ''
            )}
          >
            <Text className={cn('text-xs font-semibold', getYear(currentMonth) === y && 'text-primary-foreground')}>
              {y}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <View className="p-3 w-full">
      <View className="flex-row items-center justify-between mb-3">
        <Pressable
          onPress={() => {
            if (view === 'calendar') handlePrevMonth();
            if (view === 'years') setYearRangeStart(yearRangeStart - 12);
          }}
          className={cn(
            'h-7 w-7 items-center justify-center rounded-md border border-border',
            view === 'months' && 'opacity-0'
          )}
        >
          <ChevronLeft size={16} color="#a1a1aa" />
        </Pressable>

        <View className="flex-row gap-1 items-center">
          <Pressable
            onPress={() => setView(view === 'months' ? 'calendar' : 'months')}
            className="px-2 py-1 rounded-md"
          >
            <Text className="text-sm font-bold text-foreground">{format(currentMonth, 'MMMM')}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (view === 'years') {
                setView('calendar');
              } else {
                setYearRangeStart(Math.floor(getYear(currentMonth) / 12) * 12);
                setView('years');
              }
            }}
            className="px-2 py-1 rounded-md"
          >
            <Text className="text-sm font-bold text-foreground">
              {view === 'years' ? `${yearRangeStart} - ${yearRangeStart + 11}` : getYear(currentMonth)}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => {
            if (view === 'calendar') handleNextMonth();
            if (view === 'years') setYearRangeStart(yearRangeStart + 12);
          }}
          className={cn(
            'h-7 w-7 items-center justify-center rounded-md border border-border',
            view === 'months' && 'opacity-0'
          )}
        >
          <ChevronRight size={16} color="#a1a1aa" />
        </Pressable>
      </View>

      <View className="min-h-[220px]">
        {view === 'calendar' && renderCalendar()}
        {view === 'months' && renderMonths()}
        {view === 'years' && renderYears()}
      </View>
    </View>
  );
}
