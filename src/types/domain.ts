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
    daysOfWeek?: string[];
}

export interface Milestone {
    id: string;
    title: string;
    targetDate: string;
    completed: boolean;
}

export interface AIGeneratedPlanSlot {
    date: string;
    dayTask: string;
    description: string;
    subPlans?: AIGeneratedPlanSlot[];
    estimatedHours?: number;
}

export interface Goal extends GlobalRecords {
    title: string;
    name: string;
    purpose: string;
    startDate: string;
    endDate: string;
    goalType: 'Week' | 'Month' | 'Year';
    durationValue?: number;
    plans?: AIGeneratedPlanSlot[];
    milestones?: Milestone[];
}

export interface CustomTask extends GlobalRecords {
    name: string;
    description?: string;
    startTime: string;
    endTime: string;
    daysOfWeek: string[];
    color?: string;
}
