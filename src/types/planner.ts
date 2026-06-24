export interface ReminderItem {
    id: string;
    name: string;
    time: string; // e.g. "14:15"
    dayIdx: number; // 0-6
    description?: string;
    color?: string;
    isReminder?: boolean;
}

export interface PlanSlot {
    type: 'goal' | 'custom' | 'habit';
    name: string;
    goalId?: string;
    color?: string;
    isReminder?: boolean;
    description?: string;
}

export type GridState = Record<string, PlanSlot> & {
    reminders?: ReminderItem[];
};

