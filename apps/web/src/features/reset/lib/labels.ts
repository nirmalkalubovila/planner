import { RESET_DAY_NAMES, RESET_DAY_SHORT, formatMinutes, slotLabel, type ResetItem, type ResetPlace } from '@llb/core';

export const dayLabel = (dayIdx: number, todayIdx: number) => {
    if (dayIdx === todayIdx) return 'Today';
    if (todayIdx !== -1 && dayIdx === todayIdx + 1) return 'Tomorrow';
    return RESET_DAY_NAMES[dayIdx];
};

export const shortDayLabel = (dayIdx: number, todayIdx: number) => (dayIdx === todayIdx ? 'Today' : RESET_DAY_SHORT[dayIdx]);

export const placeLabel = (p: ResetPlace, todayIdx: number) => `${shortDayLabel(p.dayIdx, todayIdx)} ${slotLabel(p.startSlot)}`;

/** The one line under a recommendation: where it is, where it goes, how long. */
export function itemDetail(item: ResetItem, todayIdx: number): string {
    const was = `${dayLabel(item.from.dayIdx, todayIdx)} · ${formatMinutes(item.minutes)}`;
    switch (item.action) {
        case 'keep':
            return was;
        case 'move': {
            const to = item.to!;
            return item.from.dayIdx === to.dayIdx
                ? `${shortDayLabel(to.dayIdx, todayIdx)} ${slotLabel(item.from.startSlot)} → ${slotLabel(to.startSlot)}`
                : `${shortDayLabel(item.from.dayIdx, todayIdx)} → ${shortDayLabel(to.dayIdx, todayIdx)} · ${formatMinutes(item.minutes)}`;
        }
        case 'reduce':
            return `${formatMinutes(item.minutes)} → ${formatMinutes(item.newMinutes ?? item.minutes)}`;
        default:
            return "From this week's plan";
    }
}

export const ACTION_LABEL = { keep: 'Keep', move: 'Move', reduce: 'Reduce', remove: 'Remove' } as const;
