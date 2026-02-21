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
    description?: string;
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
    purpose?: string;
    startDate?: string;
    endDate?: string;
    daysOfWeek?: string[]; // Array of selected days e.g., ['Monday', 'Tuesday']
}

export interface AIGeneratedPlanSlot {
    date: string;
    fromTime: string;
    toTime: string;
    dayTask: string;
    description: string;
}

export interface Goal extends GlobalRecords {
    name: string;
    purpose: string;
    startDate: string;
    endDate: string;
    goalType: 'Week' | 'Month' | 'Year';
    plans?: AIGeneratedPlanSlot[];
}

export interface PlanSlot {
    type: 'goal' | 'custom';
    name: string;
    goalId?: string;
}

export type GridState = Record<string, PlanSlot>; // Key: "dayIndex-slotIndex"
