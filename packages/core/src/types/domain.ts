import type { GoalContext } from './execution-profile';
import { LifeBucket } from './time';

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
    bucket?: LifeBucket;
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
    bucket?: LifeBucket;
    /** Optional per-goal context that sharpens AI plans (why, success measure, resources, past attempts). */
    goalContext?: GoalContext | null;
}

export interface CustomTask extends GlobalRecords {
    name: string;
    description?: string;
    startTime: string;
    endTime: string;
    daysOfWeek: string[];
    color?: string;
    isReminder?: boolean;
    bucket?: LifeBucket;
}
