export interface PlanSlot {
    type: 'goal' | 'custom';
    name: string;
    goalId?: string;
    color?: string;
}

export type GridState = Record<string, PlanSlot>; // Key: "dayIndex-slotIndex"
