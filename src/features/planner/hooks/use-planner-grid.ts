import { useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@/api/services/profile-service';
import { useGetHabits } from '@/api/services/habit-service';
import { WeekUtils } from '@/utils/week-utils';
import { GridState, Habit } from '@/types/global-types';
import { DAYS_OF_WEEK, SLOTS_PER_DAY } from '@/constants/scheduling';
import { timeToMinutes, minutesToTime } from '@/utils/time';

function resolvePlanEndTime(profile: { planEndTime?: string; planStartTime?: string } | null, meta: any): string {
    if (profile?.planEndTime) return profile.planEndTime;
    if (meta?.planEndTime) return meta.planEndTime;
    const startTime = profile?.planStartTime || meta?.planStartTime || '21:00';
    const packs = Number(meta?.planDurationPacks) || 2;
    return minutesToTime(timeToMinutes(startTime) + packs * 30);
}

export function usePlannerGrid(currentWeek: string, localGridState: GridState) {
    const { user } = useAuth();
    const { profile } = useUserProfile(user);
    const { data: habits } = useGetHabits();

    const sleepSlots = useMemo(() => {
        const set = new Set<number>();
        if (!user) return set;
        const sleepStartStr = profile?.sleepStart || user.user_metadata?.sleepStart || '22:00';
        const sleepDuration = Number(profile?.sleepDuration || user.user_metadata?.sleepDuration) || 8;
        const [sH, sM] = sleepStartStr.split(':').map(Number);
        const startSlot = sH * 2 + (sM >= 30 ? 1 : 0);
        const durationSlots = Math.round(sleepDuration * 2);
        for (let i = 0; i < durationSlots; i++) {
            set.add((startSlot + i) % SLOTS_PER_DAY);
        }
        return set;
    }, [user, profile]);

    const isSleepSlot = useCallback(
        (slotIdx: number) => sleepSlots.has(slotIdx),
        [sleepSlots]
    );

    const planSlotKeys = useMemo(() => {
        const set = new Set<string>();
        if (!user) return set;
        const planDay = profile?.planDay || user.user_metadata?.planDay || 'Sunday';
        const planStartTimeStr = profile?.planStartTime || user.user_metadata?.planStartTime || '21:00';
        const planEndTimeStr = resolvePlanEndTime(profile, user.user_metadata);
        const targetDayIdx = DAYS_OF_WEEK.indexOf(planDay);
        if (targetDayIdx === -1) return set;

        const [pH, pM] = planStartTimeStr.split(':').map(Number);
        const startSlot = pH * 2 + (pM >= 30 ? 1 : 0);

        const [eH, eM] = planEndTimeStr.split(':').map(Number);
        const endSlot = eH * 2 + (eM >= 30 ? 1 : 0);

        const totalSlots = endSlot > startSlot ? endSlot - startSlot : endSlot + SLOTS_PER_DAY - startSlot;
        for (let i = 0; i < totalSlots; i++) {
            set.add(`${targetDayIdx}-${(startSlot + i) % SLOTS_PER_DAY}`);
        }
        return set;
    }, [user, profile]);

    const isPlanSlot = useCallback(
        (dayIdx: number, slotIdx: number) => planSlotKeys.has(`${dayIdx}-${slotIdx}`),
        [planSlotKeys]
    );

    const habitSlotMap = useMemo(() => {
        const map = new Map<string, string>();
        (habits || []).forEach((h: Habit) => {
            const [hStartH, hStartM] = h.startTime.split(':').map(Number);
            const [hEndH, hEndM] = h.endTime.split(':').map(Number);
            const startSlot = hStartH * 2 + (hStartM >= 30 ? 1 : 0);
            const endSlot = hEndH * 2 + (hEndM >= 30 ? 1 : 0);
            const habitStartMonth = h.startDate ? h.startDate.substring(0, 7) : null;
            const hasStarted = habitStartMonth ? WeekUtils.compareWeeks(currentWeek, habitStartMonth) >= 0 : true;
            if (!hasStarted) return;
            for (let d = 0; d < 7; d++) {
                if (h.daysOfWeek && h.daysOfWeek.length > 0 && !h.daysOfWeek.includes(DAYS_OF_WEEK[d])) continue;
                for (let s = startSlot; s < endSlot; s++) {
                    map.set(`${d}-${s}`, h.name);
                }
            }
        });
        return map;
    }, [habits, currentWeek]);

    const isHabitSlot = useCallback(
        (dayIdx: number, slotIdx: number) => habitSlotMap.has(`${dayIdx}-${slotIdx}`),
        [habitSlotMap]
    );

    const cellContentMap = useMemo(() => {
        const map = new Map<string, any>();
        for (let d = 0; d < 7; d++) {
            for (let s = 0; s < SLOTS_PER_DAY; s++) {
                const key = `${d}-${s}`;
                if (sleepSlots.has(s)) {
                    map.set(key, { type: 'sleep', name: 'Sleep' });
                } else if (planSlotKeys.has(key)) {
                    map.set(key, { type: 'plan', name: 'Weekly Planning' });
                } else if (habitSlotMap.has(key)) {
                    map.set(key, { type: 'habit', name: habitSlotMap.get(key) });
                } else if (localGridState[key]) {
                    map.set(key, localGridState[key]);
                }
            }
        }
        return map;
    }, [sleepSlots, planSlotKeys, habitSlotMap, localGridState]);

    const getCellContent = useCallback(
        (dayIdx: number, slotIdx: number) => cellContentMap.get(`${dayIdx}-${slotIdx}`) || null,
        [cellContentMap]
    );

    return {
        isSleepSlot,
        isPlanSlot,
        isHabitSlot,
        getCellContent,
    };
}
