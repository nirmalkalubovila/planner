export enum Status {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
}

export interface GlobalRecords {
    id?: string;
    code?: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Habit extends GlobalRecords {
    name: string;
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
    packs: number;
    startDay: string;  // YYYY-WW-D
}

export interface GoalWeek {
    weekNum: number;
    weekLabel: string;
    hours: number;
    subGoal: string;
    isPaused: boolean;
}

export interface Goal extends GlobalRecords {
    title: string;
    totalWeeks: number;
    startWeek: string; // YYYY-WW
    weeks: GoalWeek[];
    startDate: string;
}

export interface PlanSlot {
    type: 'goal' | 'custom';
    name: string;
    goalId?: string;
}

export type GridState = Record<string, PlanSlot>; // Key: "dayIndex-slotIndex"
